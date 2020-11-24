const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const fs = require("fs");
const { authorize } = require("passport");
const passport = require("passport");
const axios = require("axios");
const fetch = require("node-fetch");

const Subscription = require("../../models/Subscription");
const User = require("../../models/User");

router.post(
  "/getoauthurl",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    fs.readFile("./credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);

      const { client_secret, client_id, redirect_uris } = JSON.parse(
        content
      ).web;
      console.log(req.user);
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[1]
      );

      const SCOPES = [
        "https://www.googleapis.com/auth/drive.metadata.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/drive",
      ];

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        state: req.user.email,
      });

      res.status(200).json({ url: authUrl });
    });
  }
);

router.get("/addsubscription", (req, res) => {
  const TOKEN_PATH = "token12.json";
  fs.readFile("./credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), log);
  });

  const authorize = (credentials, log) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[1]
    );
    log(oAuth2Client);
  };

  const log = (oAuth2Client) => {
    oAuth2Client.getToken(req.query.code, async (err, token) => {
      if (err)
        res.status(400).json({ error: `Error retrieving access token:${err}` });
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions

      // Store the token to disk for later program executions

      console.log(JSON.stringify(token));
      console.log(
        "/////////////////////////////////////////////////////",
        token.access_token
      );

      let response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      let data = await response.json();
      console.log(data.email);
      console.log(req.query);
      const subscription = {
        email: data.email,
        token,
      };
      User.findOne({ email: req.query.state }).then((user) => {
        if (user) {
          Subscription.findOne({ user, email: data.email })
            .then((sub) => {
              if (sub) {
                res
                  .status(200)
                  .json({ msg: "already subscribed to this account" });
              } else {
                subscription.user = user;
                new Subscription(subscription)
                  .save()
                  .then((r) =>
                    res
                      .status(200)
                      .json({ msg: `subscribed to ${data.email} successfully` })
                  )
                  .catch((err) => res.status(400).json({ error: err }));
              }
            })
            .catch((err) => res.status(400).json({ error: err }));
        } else res.status(400).json({ error: "user not found" });
      });
    });
  };
});

router.post(
  "/getgoogleaccounts",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ email: req.user.email })
      .then((user) => {
        Subscription.find({ user }, "email")

          .then((emails) => res.status(200).json(emails))
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  }
);

router.post(
  "/deletegoogleaccount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ email: req.user.email })
      .then((user) => {
        Subscription.findOneAndDelete({ user, email: req.body.email })

          .then((account) => res.status(200).json(account))
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  }
);
module.exports = router;
