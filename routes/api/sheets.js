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
const Sheet = require("../../models/Sheet");
const { sheets } = require("googleapis/build/src/apis/sheets");

router.post(
  "/getsheets",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    fs.readFile("./credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);

      const { client_secret, client_id, redirect_uris } = JSON.parse(
        content
      ).web;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[1]
      );

      Subscription.findOne({ user: req.user._id, email: req.body.email })
        .then(async (sub) => {
          oAuth2Client.setCredentials(sub.token);
          const files = await listSheets(oAuth2Client);
          if (files) {
            res.status(200).json(files);
          }
        })
        .catch((err) => res.status(400).json({ error: err }));
    });
  }
);

router.post(
  "/gettabs",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    fs.readFile("./credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);

      const { client_secret, client_id, redirect_uris } = JSON.parse(
        content
      ).web;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[1]
      );

      Subscription.findOne({ user: req.user._id, email: req.body.email }).then(
        async (sub) => {
          oAuth2Client.setCredentials(sub.token);
          const files = await listTabs(oAuth2Client, req.body.fileid);
          if (files) {
            res.status(200).json(files);
          }
        }
      );
    });
  }
);

async function listSheets(auth) {
  const drive = google.drive({ version: "v3", auth });
  const files = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: "nextPageToken, files(id, name)",
  });

  if (files.status === 200) {
    return files.data.files;
  } else return false;
}

async function listTabs(auth, fileID) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.get({
    spreadsheetId: fileID,
  });

  return res.data.sheets;
}

router.post(
  "/addtowatchlist",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findOne({ email: req.user.email })
      .then((user) => {
        Subscription.findOne({ user, email: req.body.email })
          .then((subscription) => {
            Sheet.findOne({
              user,
              subscription,
            })
              .then((sheet) => {
                console.log(sheet);
                if (!sheet) {
                  sheet = new Sheet({
                    user,
                    subscription,
                    sheets: req.body.sheet,
                  });
                  sheet
                    .save()
                    .then((r) => res.status(200).json(r))
                    .catch((e) => res.status(400).json(e));
                }
                sheet.sheets = sheet.sheets.filter((item) => {
                  return item.sheetid != req.body.sheet.sheetid;
                });
                if (req.body.sheet.tabs.length != 0) {
                  sheet.sheets.push(req.body.sheet);
                }
                sheet.save();
              })
              .then((r) => res.status(200).json(r))
              .catch((e) => res.status(400).json(e));
          })
          .catch((err) => res.status(400).json({ error: err }));
      })
      .catch((err) => res.status(400).json({ error: err }));
  }
);

router.post(
  "/getcolumncount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    fs.readFile("./credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);

      Subscription.find({ user: req.user._id }).then(async (subs) => {
        const test = subs.map(async (sub, index) => {
          const { client_secret, client_id, redirect_uris } = JSON.parse(
            content
          ).web;
          const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[1]
          );
          oAuth2Client.setCredentials(sub.token);

          const sheets = await Sheet.findOne({ subscription: sub });
          console.log(sheets);
          if (!sheets) {
            return;
          }
          const test = await sheets.sheets.map(async (sheet, index) => {
            const sheetsData = await columnCount(oAuth2Client, sheet);

            return sheetsData;
          });

          return Promise.all(test).then((r) => r);
        });
        console.log(test, "test");
        Promise.all(test).then((r) => {
          r = r.filter((account) => account);
          console.log(r);
          res.status(200).json(r);
        });
      });
    });
  }
);

async function columnCount(auth, sheet) {
  let data = {};
  let tabs = [];
  const sheets = google.sheets({ version: "v4", auth });
  const res1 = await sheets.spreadsheets.get({
    spreadsheetId: sheet.sheetid,
  });

  data.title = res1.data.properties.title;
  data.sheetid = sheet.sheetid;

  const ranges = [];
  sheet.tabs.map((tab) => {
    ranges.push(`${tab}!A1:ZZ2`);
  });
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: sheet.sheetid,
    ranges,
    majorDimension: "ROWS",
  });

  res.data.valueRanges.map((item) => {
    if (item.values && item.values.length >= 2) {
      tabs.push({
        name: item.range.split("!")[0],
        count: item.values[1].length,
      });
    } else {
      tabs.push({
        name: item.range.split("!")[0],
        count: 0,
      });
    }
  });
  data.tabs = tabs;

  return data;
}

module.exports = router;
