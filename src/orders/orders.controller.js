const path = require("path");

// Use the existing orders data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  const { orderId } = req.params;
  res.json({
    data: orders.filter(orderId ? (order) => order.id == orderId : () => true),
  });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundorder = orders.find((order) => order.id === orderId);
  if (foundorder) {
    res.locals.order = foundorder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function orderInBodyMatchesRoute(req, res, next) {
  const { data: { id = undefined } = {} } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function statusIsSupported(req, res, next) {
  const { data: { status = undefined } = {} } = req.body;
  const order = res.locals.order;

  if (order.status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  if (
    !status ||
    !(["pending", "preparing", "out-for-delivery", "delivered"].includes(status))
  ) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function validateOrderInput(req, res, next) {
  const {
    data: { deliverTo = undefined, mobileNumber = undefined, dishes = [] } = {},
  } = req.body;
  if (!deliverTo || deliverTo === "") {
    next({ status: 400, message: "Order must include a deliverTo" });
  }
  if (!mobileNumber || mobileNumber === "") {
    next({ status: 400, message: "Order must include a mobileNumber" });
  }
  if (!dishes) {
    next({ status: 400, message: "Order must include a dish" });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  for (var i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity <= 0
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function statusIsNotPending(req, res, next) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  next();
}

function create(req, res) {
  const {
    data: {
      deliverTo = undefined,
      mobileNumber = undefined,
      status = "pending",
      dishes = undefined,
    } = {},
  } = req.body;
  const newOrder = {
    id: nextId(), // set randomized ID
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const {
    data: {
      deliverTo = undefined,
      mobileNumber = undefined,
      status = undefined,
    } = {},
  } = req.body;

  // Update the order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;

  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [validateOrderInput, create],
  update: [
    orderExists,
    orderInBodyMatchesRoute,
    statusIsSupported,
    validateOrderInput,
    update,
  ],
  destroy: [orderExists, statusIsNotPending, destroy],
};
