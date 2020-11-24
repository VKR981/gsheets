// var fs = require('fs');
// var readline = require('readline');
// var google = require('googleapis');
// var googleAuth = require('google-auth-library');

// // If modifying these scopes, delete your previously saved credentials
// // at ~/.credentials/drive-nodejs-quickstart.json
// var SCOPES = ['https://www.googleapis.com/auth/drive'];
// var TOKEN_DIR = './';
// var TOKEN_PATH = 'drive-nodejs-quickstart.json';

// // Load client secrets from a local file.
// fs.readFile('./credentials.json', function processClientSecrets(err, content) {
//   if (err) {
//     console.log('Error loading client secret file: ' + err);
//     return;
//   }
//   // Authorize a client with the loaded credentials, then call the
//   // Drive API.
//   authorize(JSON.parse(content), createFolder);
// });

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  *
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
//   var clientSecret = credentials.installed.client_secret;
//   var clientId = credentials.installed.client_id;
//   var redirectUrl = credentials.installed.redirect_uris[0];
//   var auth = new googleAuth();
//   var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

//   // Check if we have previously stored a token.
//   fs.readFile(TOKEN_PATH, function(err, token) {
//     if (err) {
//       getNewToken(oauth2Client, callback);
//     } else {
//       oauth2Client.credentials = JSON.parse(token);
//       callback(oauth2Client);
//     }
//   });
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  *
//  * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback to call with the authorized
//  *     client.
//  */
// function getNewToken(oauth2Client, callback) {
//   var authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES
//   });
//   console.log('Authorize this app by visiting this url: ', authUrl);
//   var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
//   rl.question('Enter the code from that page here: ', function(code) {
//     rl.close();
//     oauth2Client.getToken(code, function(err, token) {
//       if (err) {
//         console.log('Error while trying to retrieve access token', err);
//         return;
//       }
//       oauth2Client.credentials = token;
//       storeToken(token);
//       callback(oauth2Client);
//     });
//   });
// }

// /**
//  * Store token to disk be used in later program executions.
//  *
//  * @param {Object} token The token to store to disk.
//  */
// function storeToken(token) {
//   fs.writeFile(TOKEN_PATH, JSON.stringify(token));
//   console.log('Token stored to ' + TOKEN_PATH);
// }

// /**
//  * Lists the names and IDs of up to 10 files.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function createFolder(auth) {
//       const drive = google.drive('v3');
//       console.log('auth:', auth);
//       const fileMetadata = {
//         'name': 'daily-report',
//         'mimeType': 'application/vnd.google-apps.folder',
//         'parents': ['1P924MEzU_1VoL6OOvWPHSo6vb1u9u0a9'],
//       };

//       drive.files.create({
//         auth: auth,
//         resource: fileMetadata,
//         fields: 'id',
//       }, function(err, file) {
//         if (err) {
//           // Handle error
//           console.error(err.message);
//         } else {
//           console.log('Folder Id: ', file.id);
//         }
//       });
//     }















const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
var SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token14.json';

// Load client secrets from a local file.
fs.readFile('./credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state:'idcustom',
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'nextPageToken, files(id, name)'
}, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
      printInfo(auth,files[0].id)
    } else {
      console.log('No files found.');
    }
  });
}

function printInfo(auth,fileID){
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.get({
          
              spreadsheetId: fileID,
              
            },
            (err, res) => {
              if (err) {
                console.error('The API returned an error.');
                throw err;
              }
            console.log(res.data.sheets[0].properties);
            })

    sheets.spreadsheets.values.get({
        spreadsheetId: fileID,
        range:['Sheet12!A1:ZZ2'],
        majorDimension:'ROWS'
    },
    (err, res) => {
      if (err) {
        console.error('The API returned an error.');
        throw err;
      }
    console.log(res.data);
    })

    // sheets.spreadsheets.values.get(
    //     {
          
    //       spreadsheetId: fileID,
    //       range: 'First Name!A1:E',
    //     },
    //     (err, res) => {
    //       if (err) {
    //         console.error('The API returned an error.');
    //         throw err;
    //       }
    //       const rows = res.data.values;
    //       if (rows.length === 0) {
    //         console.log('No data found.');
    //       } else {
    //         console.log('Name, Major:');
    //         for (const row of rows) {
    //           // Print columns A and E, which correspond to indices 0 and 4.
    //           console.log(`${row[0]}, ${row[4]}`);
    //         }
    //       }
    //     }
    //   );
}