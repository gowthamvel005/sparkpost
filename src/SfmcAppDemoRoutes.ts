'use strict';
import axios from 'axios';
import express = require("express");
import jwt = require('jwt-simple');
import SfmcApiHelper from './SfmcApiHelper';
import Utils from './Utils';


// <!-- Integrate an externally hosted app via iframe. -->
export default class SfmcAppDemoRoutes
{
    
    // Instance variables
    private _apiHelper = new SfmcApiHelper();


   

    /**
     * GET handler for: /appdemooauthtoken
     * getOAuthAccessToken: called by demo app to get an OAuth access token
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-getting-started.meta/mc-getting-started/get-access-token.htm
     * 
     */
    public getOAuthAccessToken(req: express.Request, res: express.Response)
    {
        let self = this;
        let sessionId = req.session.id;
        let clientId = process.env.DF18DEMO_CLIENTID;
        let clientSecret = process.env.DF18DEMO_CLIENTSECRET;
        
        //console.log('here we are cid' + clientId);
        //console.log('here we are cs' + clientSecret);
        
        

        req.session.oauthAccessToken = "";
        req.session.oauthAccessTokenExpiry = "";

        Utils.logInfo("getOAuthAccessToken route entered. SessionId = " + sessionId);

        if (clientId && clientSecret)
        {
            Utils.logInfo("Getting OAuth Access Token with ClientID and ClientSecret from in environment variables.");
			Utils.logInfo("This was called from axios reactjs");
            
            // set the desired timeout in options
            

            
             self._apiHelper.getOAuthAccessToken(clientId, clientSecret)           
            .then((result) => {
                req.session.oauthAccessToken = result.oauthAccessToken;
                req.session.oauthAccessTokenExpiry = result.oauthAccessTokenExpiry;
                res.status(result.status).send(result.statusText);
                req.setTimeout(0, ()=>{});
		})
            .catch((err) => {
                res.status(500).send(err);
            });
        }
        else
        {
            // error
            let errorMsg = "ClientID or ClientSecret *not* found in environment variables."; 
            Utils.logError(errorMsg);
            res.status(500).send(errorMsg);
        }
		
		//Utils.logInfo("called for data extension creation");
		//		self.loadData(req, res);
	}

    public sparkpostverify(req: express.Request, res: express.Response)
    {
        //let self = this;
        Utils.logInfo("Sparkpost Verify.");
        //self._apiHelper.createDataExtension(req, res);
        Utils.logInfo("Request Body." + req);

        let headers = {
            'Content-Type': 'application/json',
        };

        let postBody = {
            'Account ID': 'salesforceintegration',
            'Name': 'BS',
            'User ID': 'bryan@martekApps'
        };
        
        let sfmcAuthServiceApiUrl = "https://martek.hosted.emailanalyst.com/rest/auth/login_via_saml?ssoGroup=martekSSO";
        Utils.logInfo("oauth token is called, waiting for status...");
        axios.post(sfmcAuthServiceApiUrl, postBody, {"headers" : headers})            
        .then((result : any) => {
            // success
            Utils.logInfo("Success, got auth token from MC...");
            let accessToken = result.data.access_token;
            res.status(200).send(result);
        })
        .catch((err : any) => {
            Utils.logInfo("error, got auth token from MC..."+err);
            res.status(500).send(err);
        });
    }

    public getavailabledomains(req: express.Request, res: express.Response){
        let sfmcAuthServiceApiUrl = "http://api.edatasource.com/v4/inbox/domains/available?Authorization=b9481863c2764a46ae81e054a8fc4f65";
        Utils.logInfo("Get all available domains...");
        //axios.get(sfmcAuthServiceApiUrl)     

        axios({
            method: 'get',
            url: 'http://api.edatasource.com/v4/inbox/domains/available?Authorization=b9481863c2764a46ae81e054a8fc4f65'
        })

        .then(function (result: { data: string; }) {            
            Utils.logInfo("Success, got all available domains..."+result.data);
            res.status(200).send(result.data);     
            })         
        .catch(function (err: any) {             
                Utils.logInfo("error, getting all available domains..."+JSON.stringify(err));
            res.status(500).send(err);       
        });       
    }

    public getdomaindeliverability(req: express.Request, res: express.Response){
        let sfmcAuthServiceApiUrl = "http://api.edatasource.com/v4/inbox/deliverability/email.gap.com?qd=daysBack%3A30&Authorization=b9481863c2764a46ae81e054a8fc4f65";
        Utils.logInfo("Get Domain Deliverability......");
        Utils.logInfo("params++"+req.query.domain);   
        
        axios({
            method: 'get',
            url: 'http://api.edatasource.com/v4/inbox/deliverability/'+req.query.domain+'?qd=daysBack%3A30&Authorization=b9481863c2764a46ae81e054a8fc4f65'
        })

        .then(function (response: { data: string; }) {            
            Utils.logInfo("Success, Got Domain Deliverability..."+response.data);
            res.status(200).send(response.data);     
            })         
        .catch(function (err: string) {             
                Utils.logInfo("error, Getting Domain Deliverability..."+err);
            res.status(500).send(err);       
        });       
    }

    public appUserInfo(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Retrieving Data Extension FolderID Routed to Helper class.");
        self._apiHelper.appUserInfo(req, res);
    }

    public dataFolderCheck(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Checking whether the data folder is present or not.");
        self._apiHelper.dataFolderCheck(req, res);
    }

    public retrievingDataExtensionFolderID(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Data Extension's folder ID need to be fetched");
        self._apiHelper.retrievingDataExtensionFolderID(req, res);
    }
    //createSparkpostIntegrationFolder
    public createSparkpostIntegrationFolder(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Creating Sparkpost Integration Folder");
        self._apiHelper.createSparkpostIntegrationFolder(req, res);
    }

    public domainConfigurationDECheck(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Domain configuration Data Extension checking");
        self._apiHelper.domainConfigurationDECheck(req, res);
    }
    //insertRowForDC

    public insertRowForDC(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Inserting Data in Domain Configuration DE");
        self._apiHelper.insertRowForDC(req, res);
    }

    //intelliseedListsDECheck

    public intelliseedListsDECheck(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Intelliseed Lists Data Extension checking");
        self._apiHelper.intelliseedListsDECheck(req, res);
    }

    public insertRowForISL(req: express.Request, res: express.Response) {
        let self = this;
        Utils.logInfo("Inserting Data in Domain Configuration DE");
        self._apiHelper.insertRowForISL(req, res);
    }
}
