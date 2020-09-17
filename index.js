const pjson = require("./package.json");
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

class App {
  constructor() {
    this.app = null;

    db.defaults({ polls: [] }).write();
  }

  start() {
    this.app = this.createApi();
    return new Promise((resolve) => {
      console.log("PORT", process.env.PORT);
      this.app.listen(process.env.PORT, "0.0.0.0", resolve);
    });
  }

  createApi() {
    const app = express();

    const router = express.Router();

    router.use(bodyParser.json({ limit: "50mb" }));

    router.post("/poll", (req, res) => {
      const poll = req.body;
      const id = uuidv4();

      const savedPoll = {
        id: id,
        title: poll.title,
        options: poll.options.map((option) => ({
          id: uuidv4(),
          name: option.name,
          image: option.image,
        })),
      };

      db.get("polls").push(savedPoll).write();
      res.send(db.get("polls").find({ id: id }).value());
    });

    router.post("/poll/:pollId/vote", (req, res) => {
      const pollId = req.params.pollId;
      const votes = req.body.votes;
      const name = req.body.name;
      const poll = db.get("polls").find({ id: pollId }).value();
      if (!poll.votes) {
        poll.votes = [];
      }
      const alreadyVoted = poll.votes.find((vote) => vote.name === name);
      if (alreadyVoted) {
        alreadyVoted.votes = votes;
      } else {
        poll.votes.push({
          name: name,
          votes: votes,
        });
      }
      db.get("polls")
        .find({ id: poll.id })
        .assign({
          votes: poll.votes,
        })
        .write();
      res.send(poll.votes);
    });

    router.get("/poll/:pollId", (req, res) => {
      res.send(db.get("polls").find({ id: req.params.pollId }).value());
    });

    app.use("/api/v1", router);

    app.use(express.static("public"));
    app.use("/*", express.static("public"));

    return app;
  }
}

(() => {
  console.log("-- Starting Appoll --");
  console.log("Version: ", pjson.version);

  const app = new App();
  app.start().then(() => {
    console.log("Server is ready for e-business.");
  });
})();
