/*
 * Express App
 */

import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as path from "path";
import * as favicon from "serve-favicon";
import * as session from "express-session";
import SfmcApiDemoRoutes from './SfmcApiDemoRoutes';
import SfmcAppDemoRoutes from './SfmcAppDemoRoutes';
import Utils from './Utils';



const PORT = process.env.PORT || 5000

// Create & configure Express server
const app = express();
//var MemoryStore = require('memorystore')(session)

// Express configuration
app.set("port", PORT);
app.set("views", path.join(__dirname, "../views"));
app.set('view engine', 'ejs');

// Use helmet. More info: https://expressjs.com/en/advanced/best-practice-security.html
var helmet = require('helmet')
app.use(helmet());
// Allow X-Frame from Marketing Cloud. Sets "X-Frame-Options: ALLOW-FROM http://exacttarget.com".
app.use(helmet.frameguard({
    action: 'allow-from',
    domain: 'https://mc.s11.exacttarget.com'
  }))

app.use(session({
    name: 'server-session-cookie-id',
    secret: 'sanagama-df18',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({type: 'application/jwt'}));

// Setup static paths
app.use(express.static(path.join(__dirname, "../static")));
app.use(favicon(path.join(__dirname,'../static','images','favicons', 'favicon.ico')));

// Routes: pages


app.get('/', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'sparkpostapi.ejs') });
app.get('/apidemo', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'sparkpostapi.ejs') });
app.get('/appdemo', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'sparkpost.ejs') });
app.get('/jbdemo', function(req, res) { Utils.initSampleDataAndRenderView(req, res, 'jbdemo.ejs') });

const apiDemoRoutes = new SfmcApiDemoRoutes();
const appDemoRoutes = new SfmcAppDemoRoutes();

// Routes: used by this demo app that internally call Marketing Cloud REST APIs
app.post('/apidemooauthtoken', function(req, res) {
  apiDemoRoutes.getOAuthAccessToken(req, res);
});

    
// Routes: called when this demo app runs as a Marketing Cloud app in an IFRAME in the Marketing Cloud web UI
app.post('/appdemoauthtoken', function(req, res) {
  appDemoRoutes.getOAuthAccessToken(req, res); });

  app.post('/appuserinfo', function(req, res) {
    appDemoRoutes.appUserInfo(req, res); });

    //dataFolderCheck
  //datafoldercheck
  app.post('/datafoldercheck', function(req, res) {
    appDemoRoutes.dataFolderCheck(req, res); });

   

    app.post('/retrievingdataextensionfolderid', function(req, res) {
      appDemoRoutes.retrievingDataExtensionFolderID(req, res); });

       //createsparkpostintegrationfolder
    //createSparkpostIntegrationFolder
    app.post('/createsparkpostintegrationfolder', function(req, res) {
      appDemoRoutes.createSparkpostIntegrationFolder(req, res); });

      //domainconfigurationdecheck
      app.post('/domainconfigurationdecheck', function(req, res) {
        appDemoRoutes.domainConfigurationDECheck(req, res); });

  app.post('/sparkpostverify', function(req, res) {
  appDemoRoutes.sparkpostverify(req, res); });

  app.get('/getavailabledomains', function(req, res) {
  appDemoRoutes.getavailabledomains(req, res); });

  app.get('/getdomaindeliverability', function(req, res) {
  appDemoRoutes.getdomaindeliverability(req, res); });

  //insertrowfordc
  app.post('/insertrowfordc', function(req, res) {
  appDemoRoutes.insertRowForDC(req, res); });

  app.post('/intelliseedlistsdecheck', function(req, res) {
    appDemoRoutes.intelliseedListsDECheck(req, res); });

    app.post('/insertrowforisl', function(req, res) {
      appDemoRoutes.insertRowForISL(req, res); });
  
  



// Marketing Cloud POSTs the JWT to the '/login' endpoint when a user logs in


module.exports = app;
