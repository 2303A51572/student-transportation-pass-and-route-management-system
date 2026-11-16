const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// @desc    Driver starts a trip
// @route   POST /api/trips/start
// @access  Private (Driver)
exports.startTrip = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id }).populate('assignedBus');
    if (!driver || !driver.assignedBus) {
      return res.status(400).json({ success: false, message: 'Driver has no bus assigned.' });
    }

    const { tripType } = req.body;
    const bus = await Bus.findById(driver.assignedBus._id).populate('assignedRoute');
    if (!bus.assignedRoute) {
      return res.status(400).json({ success: false, message: 'Bus is not assigned to any route.' });
    }

    // Check if trip already in progress
    let existingTrip = await Trip.findOne({
      driver: driver._id,
      status: 'IN_PROGRESS'
    });

    if (existingTrip) {
      return res.status(200).json({
        success: true,
        message: 'Active trip resumed',
        trip: existingTrip
      });
    }

    const trip = await Trip.create({
      bus: bus._id,
      route: bus.assignedRoute._id,
      driver: driver._id,
      tripType: tripType || 'MORNING_PICKUP',
      tripDate: new Date(),
      status: 'IN_PROGRESS',
      currentStop: bus.assignedRoute.startPoint || 'Origin Terminal',
      passengerCount: 0,
      startedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Trip started successfully',
      trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Driver updates current stop
// @route   PATCH /api/trips/:id/stop
// @access  Private (Driver)
exports.updateTripStop = async (req, res, next) => {
  try {
    const { stopName } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    trip.currentStop = stopName;
    await trip.save();

    res.status(200).json({
      success: true,
      message: `Current location updated to ${stopName}`,
      trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Driver completes trip
// @route   PATCH /api/trips/:id/complete
// @access  Private (Driver)
exports.completeTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    trip.status = 'COMPLETED';
    trip.completedAt = new Date();
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip marked as completed successfully',
      trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private
exports.getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find()
      .populate('bus', 'busNumber registrationNumber')
      .populate('route', 'routeName routeCode')
      .populate('driver', 'driverName phone')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    next(error);
  }
};
