const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  const { dishId } = req.params;
  res.json({
    data: dishes.filter(dishId ? (dish) => dish.id == dishId : () => true),
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function dishInBodyMatchesRoute(req, res, next) {
  const { data: { id = undefined } = {} } = req.body;
  const { dishId } = req.params;

  if (id && id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function validateDishInput(req, res, next) {
  const {
    data: {
      name = undefined,
      description = undefined,
      price = undefined,
      image_url = undefined,
    } = {},
  } = req.body;
  if (!name || name === "") {
    next({ status: 400, message: "Dish must include a name" });
  }
  if (!description || description === "") {
    next({ status: 400, message: "Dish must include a description" });
  }
  if (!price) {
    next({ status: 400, message: "Dish must include a price" });
  }
  if (!Number.isInteger(price) || price < 0) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  if (!image_url || image_url === "") {
    next({ status: 400, message: "Dish must include a image_url" });
  }
  next();
}

function create(req, res) {
  const {
    data: {
      name = undefined,
      description = undefined,
      price = undefined,
      image_url = undefined,
    } = {},
  } = req.body;
  const newDish = {
    id: nextId(), // set randomized ID
    name: name,
    description: description,
    price: Number(price),
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const {
    data: {
      name = undefined,
      description = undefined,
      price = undefined,
      image_url = undefined,
    } = {},
  } = req.body;

  // Update the dish
  dish.name = name;
  dish.description = description;
  dish.price = Number(price);
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [validateDishInput, create],
  update: [dishExists, dishInBodyMatchesRoute, validateDishInput, update],
};
