const Route = require('../models/Route');
const Bus = require('../models/Bus');
const TransportationPass = require('../models/TransportationPass');

// @desc    Get all routes with buses and passenger counts
// @route   GET /api/routes
// @access  Public (or Private)
exports.getAllRoutes = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const routes = await Route.find(query)
      .populate({
        path: 'assignedBus',
        populate: { path: 'assignedDriver', select: 'driverName phone licenseNumber' }
      })
      .sort({ routeCode: 1 });

    // Calculate real-time active pass holders for each route
    const routesWithCounts = await Promise.all(
      routes.map(async (rt) => {
        const count = await TransportationPass.countDocuments({
          route: rt._id,
          status: 'ACTIVE'
        });
        const rtObj = rt.toObject();
        rtObj.totalStudentsAllocated = count;
        return rtObj;
      })
    );

    res.status(200).json({
      success: true,
      count: routesWithCounts.length,
      routes: routesWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single route by ID
// @route   GET /api/routes/:id
// @access  Public
exports.getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).populate({
      path: 'assignedBus',
      populate: { path: 'assignedDriver' }
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const passes = await TransportationPass.find({ route: route._id, status: 'ACTIVE' })
      .populate('student', 'studentName enrolmentNo phone department year')
      .populate('bus', 'busNumber');

    res.status(200).json({
      success: true,
      route,
      passengers: passes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private (Admin, Transport Manager)
exports.createRoute = async (req, res, next) => {
  try {
    const { routeName, routeCode, startPoint, endPoint, distanceKm, estimatedDurationMin, morningStartTime, eveningReturnTime, stops, assignedBus } = req.body;

    const existing = await Route.findOne({ routeCode: routeCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Route code already exists' });
    }

    const route = await Route.create({
      routeName,
      routeCode: routeCode.toUpperCase(),
      startPoint,
      endPoint,
      distanceKm: distanceKm || 20,
      estimatedDurationMin: estimatedDurationMin || 45,
      morningStartTime: morningStartTime || '07:30 AM',
      eveningReturnTime: eveningReturnTime || '04:45 PM',
      stops: stops || [],
      assignedBus: assignedBus || null
    });

    if (assignedBus) {
      await Bus.findByIdAndUpdate(assignedBus, { assignedRoute: route._id });
    }

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private (Admin, Transport Manager)
exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    if (req.body.assignedBus) {
      await Bus.findByIdAndUpdate(req.body.assignedBus, { assignedRoute: route._id });
    }

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private (Admin)
exports.deleteRoute = async (req, res, next) => {
  try {
    const activePasses = await TransportationPass.countDocuments({
      route: req.params.id,
      status: 'ACTIVE'
    });

    if (activePasses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route: ${activePasses} active student passes are currently assigned to this route.`
      });
    }

    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Detach from bus
    await Bus.updateMany({ assignedRoute: req.params.id }, { assignedRoute: null });

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
