'use strict';

import axios from 'axios';
import express = require("express");
import Utils from './Utils';
import xml2js = require("xml2js");

export default class SfmcApiHelper
{
   
    
    
    // Instance variables 
    private _oauthToken = "";
    private member_id = "";
    private soap_instance_url = "";
    private rest_instance_url = "";
    private FolderID='';
    private ParentFolderID = '';
    private DEexternalKeyDomainConfiguration = '';
    private DEexternalKeyIntelliseedLists ='';
    private userName = '';
    
    
    
    
    /**
     * getOAuthAccessToken: POSTs to SFMC Auth URL to get an OAuth access token with the given ClientId and ClientSecret
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-getting-started.meta/mc-getting-started/get-access-token.htm
     * 
     */
    public getOAuthAccessToken(clientId: string, clientSecret: string) : Promise<any>
    {
        let self = this;
        Utils.logInfo("getOAuthAccessToken called.");
        Utils.logInfo("Using specified ClientID and ClientSecret to get OAuth token...");

        let headers = {
            'Content-Type': 'application/json',
        };

        let postBody = {
            'grant_type': 'client_credentials',
            'client_id': clientId,
            'client_secret': clientSecret
        };

        return self.getOAuthTokenHelper(headers, postBody);
    }

    

    /**
     * getOAuthTokenHelper: Helper method to POST the given header & body to the SFMC Auth endpoint
     * 
     */
    public getOAuthTokenHelper(headers : any, postBody: any) : Promise<any>
    {
        return new Promise<any>((resolve, reject) =>
        {
            Utils.logInfo("Entered to the method...");
            // POST to Marketing Cloud REST Auth service and get back an OAuth access token.
            let sfmcAuthServiceApiUrl = process.env.BASE_URL+"auth.marketingcloudapis.com/v2/token";
            Utils.logInfo("oauth token is called, waiting for status...");
            axios.post(sfmcAuthServiceApiUrl, postBody, {"headers" : headers})            
            .then((response : any) => {
                // success
                Utils.logInfo("Success, got auth token from MC...");
                let accessToken = response.data.access_token;
                Utils.logInfo("oauth token..." + accessToken);
                let bearer = response.data.token_type;
                Utils.logInfo("Bearer..." + bearer);
                let tokenExpiry = response.data.expires_in;
                Utils.logInfo("tokenExpiry..." + tokenExpiry);
                
				this._oauthToken = response.data.access_token;
				Utils.logInfo("Storing the accesstoken in a object's variable "+ this._oauthToken);
                //tokenExpiry.setSeconds(tokenExpiry.getSeconds() + response.data.expires_in);
                Utils.logInfo("Got OAuth token: " + accessToken + ", expires = " +  tokenExpiry);

                resolve(
                {
                    oauthAccessToken: accessToken,
                    oauthAccessTokenExpiry: tokenExpiry,
                    status: response.status,
                    statusText: response.statusText + "\n" + Utils.prettyPrintJson(JSON.stringify(response.data))
                });
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error getting OAuth Access Token.";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                reject(errorMsg);
            });
        });
    }
    
    public appUserInfo(req: any, res: any) {
        
        Utils.logInfo("App User Information method called ");
		let self = this;
		
		let userInfoUrl = process.env.BASE_URL +"auth.marketingcloudapis.com/v2/userinfo";
		
		let headers = {
            'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + this._oauthToken
        };
		
		axios.get(userInfoUrl,{"headers" : headers})            
            .then((response : any) => {
                // success
                Utils.logInfo("User Information response Body : "+ JSON.stringify(response.data));
				Utils.logInfo("Member ID of the Current Business Unit : "+ Utils.prettyPrintJson(JSON.stringify(response.data.organization.member_id)));
				this.member_id = response.data.organization.member_id;
				this.soap_instance_url = response.data.rest.soap_instance_url;
				Utils.logInfo("Storing the Soap URL in a object's variable "+ this.soap_instance_url+"\n");
                this.rest_instance_url = response.data.rest.rest_instance_url;
                Utils.logInfo("Storing the Rest URL in a object's variable "+ this.rest_instance_url+"\n");
                this.userName = response.data.user.name;
				Utils.logInfo("Storing the Current User name in a object's variable "+ this.userName+"\n");
				res.status(200).send("Installed Package Information Obtained");
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error getting User's Information.";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                res.status(500).send(Utils.prettyPrintJson(JSON.stringify(error.response.data)));
            });
    }

    public dataFolderCheck(req: express.Request, res: express.Response) {
		let self = this;
		self.getCategoryIDHelper()
		.then((result) => {
                res.status(result.status).send(result.statusText);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
		
    }

    public getCategoryIDHelper() : Promise<any>
	{
		Utils.logInfo('getCategoryIDHelper Method has been called.');
		let soapMessage = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Retrieve</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <RetrieveRequest>'
+'                <ObjectType>DataFolder</ObjectType>'
+'                <Properties>ID</Properties>'
+'                <Properties>CustomerKey</Properties>'
+'                <Properties>Name</Properties>'
+'                <Properties>ParentFolder.ID</Properties>'
+'                <Properties>ParentFolder.Name</Properties>'
+'                <Filter xsi:type="SimpleFilterPart">'
+'                    <Property>Name</Property>'
+'                    <SimpleOperator>equals</SimpleOperator>'
+'                    <Value>Sparkpost Integrations</Value>'
+'                </Filter>'
+'            </RetrieveRequest>'
+'        </RetrieveRequestMsg>'
+'    </s:Body>'
+'</s:Envelope>';
				
	return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml',
                'SOAPAction': 'Retrieve'
            };

            
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: soapMessage,
				headers: {'Content-Type': 'text/xml'}							
				})            
				.then((response: any) => {
                Utils.logInfo(response.data);
                var extractedData = "";
				var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let FolderID = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results'];
				Utils.logInfo('Folder ID : ' + FolderID);
					if(FolderID!=undefined){
				this.FolderID = FolderID[0]['ID'][0];
				resolve(
                {
                    status: response.status,
                    statusText: "true"
                });
				
				
				}
				else{
					resolve(
                {
                    status: response.status,
                    statusText: "false"
                });
				}				
				
				});
				
			
				})
			.catch((error: any) => {
						// error
						let errorMsg = "Error loading sample data. POST response from Marketing Cloud:";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });
    }
    
    public retrievingDataExtensionFolderID(req: express.Request, res: express.Response) {
        
        Utils.logInfo('Retrieving DataExtension Folder Properties......');
		let soapMessage = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Retrieve</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <RetrieveRequest>'
+'                <ObjectType>DataFolder</ObjectType>'
+'                <Properties>ID</Properties>'
+'                <Properties>CustomerKey</Properties>'
+'                <Properties>Name</Properties>'
+'                <Filter xsi:type="SimpleFilterPart">'
+'                    <Property>Name</Property>'
+'                    <SimpleOperator>equals</SimpleOperator>'
+'                    <Value>Data Extensions</Value>'
+'                </Filter>'
+'            </RetrieveRequest>'
+'        </RetrieveRequestMsg>'
+'    </s:Body>'
+'</s:Envelope>';
	
	
	return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml',
                'SOAPAction': 'Retrieve'
            };

            
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: soapMessage,
				headers: {'Content-Type': 'text/xml'}							
				})            
				.then((response: any) => {
                Utils.logInfo(response.data);
                var extractedData = "";
				var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let ParentFolderID = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results'][0]['ID'][0];
					
						if(ParentFolderID!=undefined){
							this.ParentFolderID = ParentFolderID;
							res.status(200).send(true);
				
				
					}
						else{
						res.status(200).send(false);
					}
							//this.creatingHearsayIntegrationFolder(ParentFolderID);
							
						
				
				});
				})
			.catch((error: any) => {
						// error
						let errorMsg = "Error getting the Data extensions folder properties......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });
    }

    public createSparkpostIntegrationFolder(req: express.Request, res: express.Response) {
       
        let createFolderData = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
                                 +'<soapenv:Header>'
                                 +'<fueloauth>'+this._oauthToken+'</fueloauth>'
                                 +'</soapenv:Header>'
                                 +'<soapenv:Body>'
                                 +'<CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">'
                                 +'<Options/>'
                                 +'<ns1:Objects xmlns:ns1="http://exacttarget.com/wsdl/partnerAPI" xsi:type="ns1:DataFolder">'
                                 +'<ns1:ModifiedDate xsi:nil="true"/>'
                                 +'<ns1:ObjectID xsi:nil="true"/>'
                                 +'<ns1:CustomerKey>Sparkpost Integrations</ns1:CustomerKey>'
                                 +'<ns1:ParentFolder>'
                                 +'<ns1:ModifiedDate xsi:nil="true"/>'
                                 +'<ns1:ID>'+this.ParentFolderID+'</ns1:ID>'
                                 +'<ns1:ObjectID xsi:nil="true"/>'
                                 +'</ns1:ParentFolder>'
                                 +'<ns1:Name>Sparkpost Integrations</ns1:Name>'
                                 +'<ns1:Description>Sparkpost Integrations Folder</ns1:Description>'
                                 +'<ns1:ContentType>dataextension</ns1:ContentType>'
                                 +'<ns1:IsActive>true</ns1:IsActive>'
                                 +'<ns1:IsEditable>true</ns1:IsEditable>'
                                 +'<ns1:AllowChildren>true</ns1:AllowChildren>'
                                 +'</ns1:Objects>'
                                 +'</CreateRequest>'
                                 +'</soapenv:Body>'
                                 +'</soapenv:Envelope>';
		
		return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml',
                'SOAPAction': 'Create'
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: createFolderData,
				headers: headers							
				})            
				.then((response: any) => {
					
					Utils.logInfo("Sparkpost Integrations Folder has been created Successfully");
                Utils.logInfo(response.data);
				var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let SparkpostIntegrationsID = result['soap:Envelope']['soap:Body'][0]['CreateResponse'][0]['Results'][0]['NewID'][0];
				Utils.logInfo('Sparkpost Integrations Folder ID : ' + SparkpostIntegrationsID);
					
						if(SparkpostIntegrationsID!=undefined){
							this.FolderID = SparkpostIntegrationsID;	
							res.status(200).send(true);			
					}
						else{
						res.status(200).send(false);
					}			
				});	
				
				})
			.catch((error: any) => {
						// error
						let errorMsg = "Error creating the Sparkpost Integrations folder......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });

    }


    public domainConfigurationDECheck(req: express.Request, res: express.Response) {
       
        Utils.logInfo('Retrieving Domain Configuration Data Extensions properties......');
				let soapMessage = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Retrieve</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <RetrieveRequest>'
+'                <ObjectType>DataExtension</ObjectType>'
+'                <Properties>ObjectID</Properties>'
+'                <Properties>CustomerKey</Properties>'
+'                <Properties>Name</Properties>'
+'                <Filter xsi:type="SimpleFilterPart">'
+'                    <Property>Name</Property>'
+'                    <SimpleOperator>equals</SimpleOperator>'
+'                    <Value>Domain Configuration</Value>'
+'                </Filter>'
+'            </RetrieveRequest>'
+'        </RetrieveRequestMsg>'
+'    </s:Body>'
+'</s:Envelope>';
	
	
	return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml',
                'SOAPAction': 'Retrieve'
            };

            
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: soapMessage,
				headers: {'Content-Type': 'text/xml'}							
				})            
				.then((response: any) => {
					Utils.logInfo("Response Body for the Domain Configuration validation");
                Utils.logInfo(response.data);
                var extractedData = "";
				var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let DomainConfiguration = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results'];
					
						if(DomainConfiguration!=undefined){
							this.DEexternalKeyDomainConfiguration = DomainConfiguration[0]['CustomerKey'];
							res.status(200).send("Domain Configuration Data Extension already created");	
					
							
						}
						else{
							this.creatingDomainConfigurationDE(req,res);
						}
				
				
				
				});
				})
			.catch((error: any) => {
						// error
						let errorMsg = "Error getting the 'Domain Configuration' Data extension properties......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });

    }

    public creatingDomainConfigurationDE(req: express.Request, res: express.Response){
        Utils.logInfo("Creating Default Data Extensions for Domain Configuration");
		
		let DCmsg = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Create</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <Objects xsi:type="DataExtension">'
+'                <CategoryID>'+this.FolderID+'</CategoryID>'
+'                <CustomerKey>Domain Configuration</CustomerKey>'
+'                <Name>Domain Configuration</Name>'
+'                <IsSendable>true</IsSendable>'
+'                <SendableDataExtensionField>'
+'                    <CustomerKey>Domain Name</CustomerKey>'
+'                    <Name>Domain Name</Name>'
+'                    <FieldType>Text</FieldType>'
+'                </SendableDataExtensionField>'
+'                <SendableSubscriberField>'
+'                    <Name>Subscriber Key</Name>'
+'                    <Value></Value>'
+'                </SendableSubscriberField>'
+'                <Fields>'
+'                    <Field>'
+'                        <CustomerKey>Domain ID</CustomerKey>'
+'                        <Name>Domain ID</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>50</MaxLength>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Domain Name</CustomerKey>'
+'                        <Name>Domain Name</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>100</MaxLength>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>true</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Inbox Threshold</CustomerKey>'
+'                        <Name>Inbox Threshold</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Engagement Threshold</CustomerKey>'
+'                        <Name>Engagement Threshold</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>SPF Threshold</CustomerKey>'
+'                        <Name>SPF Threshold</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>DKIM Threshold</CustomerKey>'
+'                        <Name>DKIM Threshold</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Campaign Min</CustomerKey>'
+'                        <Name>Campaign Min</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Intelliseed Lists</CustomerKey>'
+'                        <Name>Intelliseed Lists</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>250</MaxLength>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Threshold Recipe</CustomerKey>'
+'                        <Name>Threshold Recipe</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>250</MaxLength>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Rules Recipe</CustomerKey>'
+'                        <Name>Rules Recipe</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>250</MaxLength>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Created or Modified by</CustomerKey>'
+'                        <Name>Created or Modified by</Name>'
+'                        <FieldType>Text</FieldType>'
+'						  <DefaultValue>'+this.userName+'</DefaultValue>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Created or Modified date</CustomerKey>'
+'                        <Name>Created or Modified date</Name>'
+'                        <FieldType>Date</FieldType>'
+'						  <DefaultValue>getdate()</DefaultValue>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                </Fields>'
+'            </Objects>'
+'        </CreateRequest>'
+'    </s:Body>'
+'</s:Envelope>'
		
		
		
		
		
		Utils.logInfo("The soap data for creating the Domain Configuration Data Extension\n\n\n" + DCmsg);
		
		return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml'
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: DCmsg,
				headers: headers							
				})            
				.then((response: any) => {
				
				Utils.logInfo("Domain Configuration Data extension has been created Successfully\n\n\n");
                Utils.logInfo(response.data+"\n\n\n");

                var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let DomainConfiguration = result['soap:Envelope']['soap:Body'][0]['CreateResponse'][0]['Results'];
                
                if(DomainConfiguration!=undefined){
                    this.DEexternalKeyDomainConfiguration = DomainConfiguration[0]['Object'][0]['CustomerKey'];
                    res.status(200).send("Domain Configuration Data extension has been created Successfully");	
            
                    
                }
						
				
				
                })
            })
			.catch((error: any) => {
						// error
						let errorMsg = "Error creating the Domain Configuration Data extension......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });
    }

    public insertRowForDC(req: express.Request, res: express.Response)
    {
        Utils.logInfo("request body = " + JSON.stringify(req.body));
        let self = this;
        let sessionId = req.session.id;
        Utils.logInfo("loadData entered. SessionId = " + sessionId);
		Utils.logInfo("Getting the accesstoken in a object's variable "+ this._oauthToken);

        if (this._oauthToken!= "")
        {
            
            self.insertRowForDCHelper(this._oauthToken, JSON.stringify(req.body))
            .then((result) => {
                res.status(result.status).send(result.statusText);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
        }
        else
        {
            // error
            let errorMsg = "OAuth Access Token *not* found in session.\nPlease complete previous demo step\nto get an OAuth Access Token."; 
            Utils.logError(errorMsg);
            res.status(500).send(errorMsg);
        }
    }

    /**
     * loadDataHelper: uses the given OAuthAccessToklen to load JSON data into the Data Extension with external key "DF18Demo"
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/postDataExtensionRowsetByKey.htm
     * 
     */
    private insertRowForDCHelper(oauthAccessToken: string, jsonData: string) : Promise<any>    
    {
        let self = this;
		let _sfmcDataExtensionApiUrl = this.rest_instance_url + "/hub/v1/dataevents/key:" + this.DEexternalKeyDomainConfiguration + "/rowset";
		Utils.logInfo("URL : "+ _sfmcDataExtensionApiUrl);
        Utils.logInfo("loadDataHelper called.");
        Utils.logInfo("Loading sample data into Data Extension: " + self.DEexternalKeyDomainConfiguration);
        Utils.logInfo("Using OAuth token: " + this._oauthToken);

        return new Promise<any>((resolve, reject) =>
        {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._oauthToken
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            axios.post(_sfmcDataExtensionApiUrl, jsonData, {"headers" : headers})
            .then((response: any) => {
                // success
                Utils.logInfo("Successfully loaded sample data into Data Extension!");

                resolve(
                {
                    status: response.status,
                    statusText: response.statusText + "\n" + Utils.prettyPrintJson(JSON.stringify(response.data))
                });
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error loading sample data. POST response from Marketing Cloud:";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                reject(errorMsg);
            });
        });
    }


    public intelliseedListsDECheck(req: express.Request, res: express.Response) {
       
        Utils.logInfo('Retrieving IntelliseedLists Data Extensions properties......');
				let soapMessage = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Retrieve</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <RetrieveRequest>'
+'                <ObjectType>DataExtension</ObjectType>'
+'                <Properties>ObjectID</Properties>'
+'                <Properties>CustomerKey</Properties>'
+'                <Properties>Name</Properties>'
+'                <Filter xsi:type="SimpleFilterPart">'
+'                    <Property>Name</Property>'
+'                    <SimpleOperator>equals</SimpleOperator>'
+'                    <Value>Intelliseed Lists</Value>'
+'                </Filter>'
+'            </RetrieveRequest>'
+'        </RetrieveRequestMsg>'
+'    </s:Body>'
+'</s:Envelope>';
	
	
	return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml',
                'SOAPAction': 'Retrieve'
            };

            
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: soapMessage,
				headers: {'Content-Type': 'text/xml'}							
				})            
				.then((response: any) => {
					Utils.logInfo("Response Body for the Intelliseeds Lists validation");
                Utils.logInfo(response.data);
                var extractedData = "";
				var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let DomainConfiguration = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results'];
					
						if(DomainConfiguration!=undefined){
							this.DEexternalKeyDomainConfiguration = DomainConfiguration[0]['CustomerKey'];
							res.status(200).send("Intelliseeds Lists Data Extension already created");	
					
							
						}
						else{
							this.creatingIntelliseedListDE(req,res);
						}
				
				
				
				});
				})
			.catch((error: any) => {
						// error
						let errorMsg = "Error getting the 'Intelliseeds Lists' Data extension properties......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });

    }

    public creatingIntelliseedListDE(req: express.Request, res: express.Response){
        Utils.logInfo("Creating Default Data Extensions for Intelliseeds Lists");
		
		let ISLmsg = '<?xml version="1.0" encoding="UTF-8"?>'
+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
+'    <s:Header>'
+'        <a:Action s:mustUnderstand="1">Create</a:Action>'
+'        <a:To s:mustUnderstand="1">'+this.soap_instance_url+'Service.asmx'+'</a:To>'
+'        <fueloauth xmlns="http://exacttarget.com">'+this._oauthToken+'</fueloauth>'
+'    </s:Header>'
+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
+'        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">'
+'            <Objects xsi:type="DataExtension">'
+'                <CategoryID>'+this.FolderID+'</CategoryID>'
+'                <CustomerKey>Intelliseeds Lists</CustomerKey>'
+'                <Name>Intelliseeds Lists</Name>'
+'                <IsSendable>true</IsSendable>'
+'                <SendableDataExtensionField>'
+'                    <CustomerKey>Domain Name</CustomerKey>'
+'                    <Name>Domain Name</Name>'
+'                    <FieldType>Text</FieldType>'
+'                </SendableDataExtensionField>'
+'                <SendableSubscriberField>'
+'                    <Name>Subscriber Key</Name>'
+'                    <Value></Value>'
+'                </SendableSubscriberField>'
+'                <Fields>'
+'                    <Field>'
+'                        <CustomerKey>Domain ID</CustomerKey>'
+'                        <Name>Domain ID</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>50</MaxLength>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Domain Name</CustomerKey>'
+'                        <Name>Domain Name</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>100</MaxLength>'
+'                        <IsRequired>true</IsRequired>'
+'                        <IsPrimaryKey>true</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Intelliseed List Name</CustomerKey>'
+'                        <Name>Intelliseed List Name</Name>'
+'                        <FieldType>Text</FieldType>'
+'                        <MaxLength>100</MaxLength>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                    <Field>'
+'                        <CustomerKey>Size</CustomerKey>'
+'                        <Name>Size</Name>'
+'                        <FieldType>Decimal</FieldType>'
+'                        <Precision>18</Precision>'
+'                          <Scale>0</Scale>'
+'                        <IsRequired>false</IsRequired>'
+'                        <IsPrimaryKey>false</IsPrimaryKey>'
+'                    </Field>'
+'                </Fields>'
+'            </Objects>'
+'        </CreateRequest>'
+'    </s:Body>'
+'</s:Envelope>'
		
		
		
		
		
		Utils.logInfo("The soap data for creating the Intelliseeds Lists Data Extension\n\n\n" + ISLmsg);
		
		return new Promise<any>((resolve, reject) =>
		{
			let headers = {
                'Content-Type': 'text/xml'
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            axios({
				method: 'post',
				url: ''+this.soap_instance_url+'Service.asmx'+'',
				data: ISLmsg,
				headers: headers							
				})            
				.then((response: any) => {
				
				Utils.logInfo("Intelliseeds Lists Data extension has been created Successfully\n\n\n");
                Utils.logInfo(response.data+"\n\n\n");

                var parser = new xml2js.Parser();
				parser.parseString(response.data, (err: any, result: { [x: string]: { [x: string]: { [x: string]: { [x: string]: any; }[]; }[]; }; }) => {
				let IntelliseedLists = result['soap:Envelope']['soap:Body'][0]['CreateResponse'][0]['Results'];
                
                if(IntelliseedLists!=undefined){
                    this.DEexternalKeyIntelliseedLists = IntelliseedLists[0]['Object'][0]['CustomerKey'];
                    res.status(200).send("Intelliseeds Lists Data extension has been created Successfully");	
            
                    
                }
						
				
				
                })
            })
			.catch((error: any) => {
						// error
						let errorMsg = "Error creating the Domain Configuration Data extension......";
						errorMsg += "\nMessage: " + error.message;
						errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
						errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
						Utils.logError(errorMsg);

										reject(errorMsg);
									});
			
        });
    }

    public insertRowForISL(req: express.Request, res: express.Response)
    {
        Utils.logInfo("Request body for Intelliseed List = " + JSON.stringify(req.body));
        let self = this;
        let sessionId = req.session.id;
        Utils.logInfo("loadData entered. SessionId = " + sessionId);
		Utils.logInfo("Getting the accesstoken in a object's variable "+ this._oauthToken);

        if (this._oauthToken!= "")
        {
            
            self.insertRowForISLHelper(this._oauthToken, JSON.stringify(req.body))
            .then((result) => {
                res.status(result.status).send(result.statusText);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
        }
        else
        {
            // error
            let errorMsg = "OAuth Access Token *not* found in session.\nPlease complete previous demo step\nto get an OAuth Access Token."; 
            Utils.logError(errorMsg);
            res.status(500).send(errorMsg);
        }
    }

    /**
     * loadDataHelper: uses the given OAuthAccessToklen to load JSON data into the Data Extension with external key "DF18Demo"
     * 
     * More info: https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/postDataExtensionRowsetByKey.htm
     * 
     */
    private insertRowForISLHelper(oauthAccessToken: string, jsonData: string) : Promise<any>    
    {
        let self = this;
		let _sfmcDataExtensionApiUrl = this.rest_instance_url + "/hub/v1/dataevents/key:" + this.DEexternalKeyIntelliseedLists + "/rowset";
		Utils.logInfo("URL : "+ _sfmcDataExtensionApiUrl);
        Utils.logInfo("loadDataHelper called.");
        Utils.logInfo("Loading data into intelliseed list Data Extension: " + self.DEexternalKeyIntelliseedLists);
        Utils.logInfo("Using OAuth token: " + this._oauthToken);

        return new Promise<any>((resolve, reject) =>
        {
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._oauthToken
            };

            // POST to Marketing Cloud Data Extension endpoint to load sample data in the POST body
            axios.post(_sfmcDataExtensionApiUrl, jsonData, {"headers" : headers})
            .then((response: any) => {
                // success
                Utils.logInfo("Successfully loaded sample data into Data Extension!");

                resolve(
                {
                    status: response.status,
                    statusText: response.statusText + "\n" + Utils.prettyPrintJson(JSON.stringify(response.data))
                });
            })
            .catch((error: any) => {
                // error
                let errorMsg = "Error loading data into Intelliseed Lists. POST response from Marketing Cloud:";
                errorMsg += "\nMessage: " + error.message;
                errorMsg += "\nStatus: " + error.response ? error.response.status : "<None>";
                errorMsg += "\nResponse data: " + error.response.data ? Utils.prettyPrintJson(JSON.stringify(error.response.data)) : "<None>";
                Utils.logError(errorMsg);

                reject(errorMsg);
            });
        });
    }
	
        
}

