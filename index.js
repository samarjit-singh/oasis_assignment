const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");

// const AppError = require("./AppError");

const Product = require("./models/product");
const Farm = require("./models/farm");
const { Console } = require("console");

mongoose
  .connect("mongodb://localhost:27017/farmStandTake2")
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// middleware to get info from body in a post request
app.use(express.urlencoded({ extended: true }));
// for overriding POST request to PUT request
app.use(methodOverride("_method"));

// FARM ROUTES

app.get("/farms", async (req, res) => {
  const farms = await Farm.find({});
  res.render("farms/index", { farms });
});

app.get("/farms/new", (req, res) => {
  res.render("farms/new");
});

app.get("/farms/:id", async (req, res) => {
  const farm = await Farm.findById(req.params.id).populate("products");
  res.render("farms/show", { farm });
});

app.delete("/farms/:id", async (req, res) => {
  const farm = await Farm.findByIdAndDelete(req.params.id);
  res.redirect("/farms");
});

app.post("/farms", async (req, res) => {
  const farm = new Farm(req.body);
  await farm.save();
  res.redirect("/farms");
});

app.get("/farms/:id/products/new", async (req, res) => {
  const { id } = req.params;
  const farm = await Farm.findById(id);
  res.render("products/new", { categories, farm });
});

app.post("/farms/:id/products", async (req, res) => {
  const { id } = req.params;
  const farm = await Farm.findById(id);
  const { name, price, category } = req.body;
  const product = new Product({ name, price, category });
  farm.products.push(product);
  product.farm = farm;
  await farm.save();
  await product.save();
  res.redirect(`/farms/${id}`);
});

// PRODUCT ROUTES
const categories = ["fruit", "vegetable", "dairy", "fungi"];

app.get("/products", async (req, res, next) => {
  try {
    const { category } = req.query; //this is for filtering
    if (category) {
      const products = await Product.find({ category });
      // sending in products and category as props
      res.render("products/index", { products, category });
    } else {
      const products = await Product.find({});
      res.render("products/index", { products, category: "All" });
    }
  } catch (e) {
    next(e);
  }
});

// route for creating new products
// it just renders the form
app.get("/products/new", (req, res) => {
  res.render("products/new", { categories });
});

// in post request to get info from body we use
// express middle ware express.urlencoded
app.post("/products", async (req, res, next) => {
  try {
    const newProduct = new Product(req.body); //making new product
    await newProduct.save(); //saving the product
    // res.redirect(`/products/${newProduct._id}`); //redirecting
  } catch (e) {
    next(e);
  }
});

function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((e) => next(e));
  };
}

app.get(
  "/products/:id",
  wrapAsync(async (req, res, next) => {
    // destructuring and getting our ID from request
    // we are using mongo ID
    const { id } = req.params;
    const product = await Product.findById(id).populate("farm", "name");
    // if (!product) {
    //   throw next(new AppError("Product Not Found", 404));
    // }
    // To show our product product/show
    res.render("products/show", { product });
  })
);

// for editing the form
app.get("/products/:id/edit", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    // if (!product) {
    //   throw next(new AppError("Cannot Edit", 404));
    // }
    res.render("products/edit", { product, categories });
  } catch (e) {
    next(e);
  }
});

app.put("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });
    res.redirect(`/products/${product._id}`);
  } catch (e) {
    next(e);
  }
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await Product.findByIdAndDelete(id);
  res.redirect("/products");
});


app.use((err, req, res, next) => {
  const { status = 500 } = err;
  const { message = "Something went wrong" } = err;
  res.status(status).send(message);
});

app.listen(3000, () => {
  console.log("APP IS LISTENING ON PORT 3000!");
});
