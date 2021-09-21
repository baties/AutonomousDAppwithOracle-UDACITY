
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
contract('Flight Surety Tests', async (accounts) => {

  var config;
  var web3;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    web3 = new Web3(new Web3.providers.HttpProvider(config.url));
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });


    it('(airline) can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline can be registered, but does not participate in contract until it submits funding of 10 ether");

  });

  it('(airline) after registered, can participate in contract after funding of 10 ether', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    // ACT
    try {
        await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei('10', 'ether')});
        let checkFunds = await config.flightSuretyData.getAirlineFunds(config.firstAirline);
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        
    }
    catch(e) {
        console.log("error in (airline) after registered, can participate in contract after funding of 10 ether ", e);
    }
    let registeredOtherAirline = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(registeredOtherAirline, true, "Airline can be registered, but does not participate in contract until it submits funding of 10 ether");

  });

  it('(airline) Only existing airline may register a new airline until there are at least four airlines registered', async () => {
    
        // ARRANGE
        let airlineCount = await config.flightSuretyData.getRegisteredAirlineCount();
        let wasAbleToRegister = true;
        // ACT
        try {
            airlineCount++;
            for (;airlineCount <= 4; airlineCount++) {
                let newAirline = accounts[airlineCount];
                await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});

                let wasAbleToRegister = await config.flightSuretyData.isAirlineRegistered.call(newAirline);
            }
            
        }
        catch(e) {
            console.log("error in (airline) after registered, can participate in contract after funding of 10 ether ", e);
        }
        
        // ASSERT
        assert.equal(wasAbleToRegister, true, "Existing airline was not able to register a new airline until there are at least four airlines registered");

    }); 

    it('(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
    
        // ARRANGE
        let airlineCount = await config.flightSuretyData.getRegisteredAirlineCount();
        airlineCount++;
        let isFunded = false;
        let isNewAirlineRegistered = false;
        let wasAbleToRegister = false;
        newAirline = accounts[airlineCount];
        console.log("Intial airlineCount!!!! " + airlineCount);
        // ACT
        try {
            isFunded = await config.flightSuretyData.isAirlineRegistered.call(accounts[2]);
            if (!isFunded)
               await config.flightSuretyApp.fundAirline({from: accounts[2], value: web3.utils.toWei('10', 'ether')});
            isFunded = await config.flightSuretyData.isAirlineRegistered.call(accounts[3]);
            if (!isFunded)
               await config.flightSuretyApp.fundAirline({from: accounts[3], value: web3.utils.toWei('10', 'ether')});
            if (!isNewAirlineRegistered)
                isNewAirlineRegistered = await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
            if (!isNewAirlineRegistered)
                isNewAirlineRegistered = await config.flightSuretyApp.registerAirline(newAirline, {from: accounts[2]});
            if (!isNewAirlineRegistered)
                isNewAirlineRegistered = await config.flightSuretyApp.registerAirline(newAirline, {from: accounts[3]});

        }
        catch(e) {
            console.log("(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines ", e);
        }
        wasAbleToRegister = await config.flightSuretyData.isAirlineRegistered.call(newAirline);
        // ASSERT
        assert.equal(wasAbleToRegister, true, "Registration of fifth and subsequent airlines should requires multi-party consensus of 50% of registered airlines");

    });

});