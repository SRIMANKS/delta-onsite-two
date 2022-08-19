const express = require("express");
const app = express();
const mongoose = require("mongoose");
const websiteModel = require("./models/website");
const userModel = require("./models/user");
const linkModel = require("./models/link");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

mongoose
  .connect(
    "mongodb://127.0.0.1:27017/dot2",
    { useNewUrlParser: true },
    { useUnifiedTopology: true }
  )
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => console.log(err));

app.set("view engine", "ejs");
app.use("/views", express.static(__dirname + "/views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: "goodsecret" }));
app.use(methodOverride("_method"));
app.use(flash());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function verification(req, res, next) {
  try {
    const token = req.session.token;
    console.log(`Verifying ${token}`);
    if (typeof token == "undefined" || token == null) {
      throw new Error("Invalid token");
    }
    const user = jwt.verify(req.session.token, process.env.SECRET);
    if (typeof user == "undefined" || user == null) {
      throw new Error("Invalid token");
    } else {
      next();
    }
  } catch (e) {
    req.flash("info", "you must be logged in to view this page");
    res.redirect("/login");
  }
}

app.get("/register", (req, res) => {
  res.render("register", { message: req.flash("error") });
});

app.post("/register", async (req, res, next) => {
  try {
    
    const user = await userModel.findOne({ username: req.body.username });
    console.log(user);
    if (!user) {
      const hashpass = await bcrypt.hash(req.body.password, 12);
      const newuser = new userModel({
        username: req.body.username,
        password: hashpass,
      });
      await newuser.save();
      const token = jwt.sign(
        { username: req.params.username },
        process.env.SECRET,
        { expiresIn: "5h" }
      );
      req.session.token = token;
      res.redirect("/login");
    } else {
      req.flash("error", "user name already exist");
      res.redirect("/register");
    }
  } catch (e) {
    next(e);
  }
});

app.get("/login", async (req, res) => {
  res.render("login", { message: req.flash("info") });
});

app.post("/login", async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.body.username });
    if (user) {
      const isMatch = bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        const token = jwt.sign(
          { username: req.body.username, userid: String(user._id) },
          process.env.SECRET,
          { expiresIn: "5h" }
        );
        req.session.token = token;
        console.log(`token is ${req.session.token}`);
        req.flash("success", "You are logged in");
        res.redirect("/");
      } else {
        req.flash("info", "Invalid username or password");
        res.redirect("/login");
      }
    } else {
      console.log("user not found");
      req.flash("info", "Invalid username or password");
      res.redirect("/login");
    }
  } catch (e) {
    next(e);
  }
});

app.get("/website", verification, async (req, res) => {
  res.render("form", { message: req.flash("error") });
});

app.post("/website", verification, async (req, res, next) => {
  try {
    const website = await websiteModel.findOne({ name: req.body.name });
    const user = jwt.verify(req.session.token, process.env.SECRET);
    console.log(user);

    if (!website) {
      const newwebsite = new websiteModel({
        name: req.body.name,
        mailid: req.body.mailid,
        instagramid: req.body.instagramid,
        facebookid: req.body.facebookid,
        twitterid: req.body.twitterid,
        linkedinid: req.body.linkedinid,
        creatorid: user.userid,
      });
      await newwebsite.save();

      const currentwebsite = await websiteModel.findOne({
        name: req.body.name,
      });
      res.redirect(`/website/${currentwebsite._id}`);
    } else {
      req.flash("error", "website already exist");
      res.redirect("/website");
    }
  } catch (e) {
    next(e);
  }
});

app.get("/website/:id", async (req, res, next) => {
  const website = await websiteModel.findById(req.params.id);
  if (website) {
  var canedit = false;
  const linkoflinks = await linkModel.find({ websiteid: req.params.id });
  try {
    const user = jwt.verify(req.session.token, process.env.SECRET);
    if (website.creatorid === user.userid) {
      canedit = true;
    }
  } catch (e) {
    console.log("verfiing  failed");
    canedit = false;
  }
    res.render("website", { website: website, canedit: canedit, links: linkoflinks });
  } else {
    req.flash("error", "website not found");
    res.redirect("/");
  }
});


app.get("/link/website/:id/", verification, async (req, res, next) => {
  res.render("link", {websiteid: req.params.id});
})


app.post("/link" , verification, async (req, res, next) => {
  const link = new linkModel({
    name: req.body.name,
    link: req.body.link,
    websiteId: req.body.websiteid,
  });
  await link.save();
  res.redirect(`/website/${req.body.websiteid}`);
});


app.delete("/link", verification, async (req, res, next) => {
  await linkModel.findByIdAndDelete(req.body.linkid);
  res.redirect(`/website/${req.body.websiteid}`);
});

app.get("/", (req, res) => {
  res.render("home",{message: req.flash("error")});
});


app.post("/", async (req, res, next) => {
const website = await websiteModel.findOne({ name: req.body.name });
if(website){
res.redirect(`/website/${website._id}`);
}
else{
  req.flash("error", "website not found");
  res.redirect("/");
}
});

app.use((err, req, res, next) => {
  res.render("error", { err: err.message });
  next(err);
});
