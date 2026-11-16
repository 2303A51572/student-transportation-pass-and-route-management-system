const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const TransportationPass = require('../models/TransportationPass');

// @desc    Get all buses with live available seats
// @route   GET /api/buses
// @access  Public / Private
exports.getAllBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find()
      .populate('assignedRoute', 'routeName routeCode startPoint endPoint')
      .populate('assignedDriver', 'driverName phone licenseNumber')
      .sort({ busNumber: 1 });

    const busesWithOccupancy = await Promise.all(
      buses.map(async (bus) => {
        const occupied = await TransportationPass.countDocuments({
          bus: bus._id,
          status: 'ACTIVE'
        });
        const busObj = bus.toObject();
        busObj.occupiedSeats = occupied;
        busObj.availableSeats = Math.max(0, bus.capacity - occupied);
        return busObj;
      })
    );

    res.status(200).json({
      success: true,
      count: busesWithOccupancy.length,
      buses: busesWithOccupancy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bus by ID
// @route   GET /api/buses/:id
// @access  Private
exports.getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('assignedRoute')
      .populate('assignedDriver');

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const passengers = await TransportationPass.find({ bus: bus._id, status: 'ACTIVE' })
      .populate('student', 'studentName enrolmentNo phone department year')
      .sort({ stopName: 1 });

    const busObj = bus.toObject();
    busObj.occupiedSeats = passengers.length;
    busObj.availableSeats = Math.max(0, bus.capacity - passengers.length);

    res.status(200).json({
      success: true,
      bus: busObj,
      passengers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private (Admin, Transport Manager)
exports.createBus = async (req, res, next) => {
  try {
    const { busNumber, registrationNumber, model, capacity, assignedRoute, assignedDriver, status, insuranceExpiry, fitnessExpiry } = req.body;

    const existing = await Bus.findOne({
      $or: [{ busNumber: busNumber.toUpperCase() }, { registrationNumber: registrationNumber.toUpperCase() }]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Bus Number or Registration Number already exists' });
    }

    const bus = await Bus.create({
      busNumber: busNumber.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      model: model || 'Tata Starbus Ultra 40S',
      capacity: Number(capacity) || 40,
      availableSeats: Number(capacity) || 40,
      assignedRoute: assignedRoute || null,
      assignedDriver: assignedDriver || null,
      status: status || 'ACTIVE',
      insuranceExpiry,
      fitnessExpiry
    });

    if (assignedDriver) {
      await Driver.findByIdAndUpdate(assignedDriver, { assignedBus: bus._id });
    }
    if (assignedRoute) {
      await Route.findByIdAndUpdate(assignedRoute, { assignedBus: bus._id });
    }

    res.status(201).json({
      success: true,
      message: 'Bus registered successfully',
      bus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private (Admin, Transport Manager)
exports.updateBus = async (req, res, next) => {
  try {
    const { assignedDriver, assignedRoute, capacity } = req.body;
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Check if new capacity is lower than current active passengers
    if (capacity) {
      const activePassengers = await TransportationPass.countDocuments({
        bus: bus._id,
        status: 'ACTIVE'
      });
      if (Number(capacity) < activePassengers) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${capacity}: ${activePassengers} active passengers already allocated.`
        });
      }
    }

    Object.assign(bus, req.body);
    await bus.save();

    if (assignedDriver) {
      await Driver.findByIdAndUpdate(assignedDriver, { assignedBus: bus._id });
    }
    if (assignedRoute) {
      await Route.findByIdAndUpdate(assignedRoute, { assignedBus: bus._id });
    }

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      bus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private (Admin)
exports.deleteBus = async (req, res, next) => {
  try {
    const activePasses = await TransportationPass.countDocuments({
      bus: req.params.id,
      status: 'ACTIVE'
    });

    if (activePasses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bus: ${activePasses} active passes are allocated to this vehicle.`
      });
    }

    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    await Driver.updateMany({ assignedBus: req.params.id }, { assignedBus: null });
    await Route.updateMany({ assignedBus: req.params.id }, { assignedBus: null });

    res.status(200).json({
      success: true,
      message: 'Bus removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
