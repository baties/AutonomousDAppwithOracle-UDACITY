import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = []
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            console.log('accts', accts);
            this.owner = accts[0];
            this.account = accts[1];
            let counter = 1;
            console.log('this.owner', this.owner);
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }
          //  console.log('airlines', this.airlines);
            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
          //  console.log('this.passengers', this.passengers);
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    getRegisteredFlights() {
        let self = this;
        console.log('self.flightSuretyData.methods!!! ', self.flightSuretyData.methods);
        let countRegisteredFlights = parseInt(self.flightSuretyData.methods.getRegisteredFlightCount().call());
        self.flights = [];

        for (let i = 0; i < countRegisteredFlights; i++) {
            let flightKey = self.flightSuretyData.methods.registeredFlights(i).call();
            let flight = self.flightSuretyData.methods.flights(flightKey).call();
            self.flights.push(flight)
        }
        self.flights.sort((a,b) => (a.sStatusCode > b.sStatusCode) ? 1 : ((b.sStatusCode > a.sStatusCode) ? -1 : 0));
        return self.flights;
    }

    fetchFlightStatus(flight, airline, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
                console.log('Flight Status!!!! ', payload)
            });
    }

    getFlights() {
        let self = this;
        let count = self.flightSuretyData.methods.getRegisteredFlightCount().call();
        self.flights = [];

        for (let i=0; i< count; i++) {
            let flightKey = self.flightSuretyData.registeredFlights(i).call();
            let flight = self.flightSuretyData.flights(flightKey).call();
            self.flights.push(flight);
        }
        console.log("self.flights!!! ", self.flights);
        return self.flights;
    } 

    setOperatingStatus(mode, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .setOperatingStatus(mode)
            .send({from: self.owner}, (error, result) => {
                callback(error, {mode: mode})
            })
    }

    registerAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods.registerAirline(airline).send({from: self.owner, gas: 9999999}, callback);
    }

    fundAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods.fundAirline().send({from: airline}, callback);
    }

    registerFlight(airline, flight, from, to, callback) {
        let self = this;
        self.flightSuretyApp.methods.registerFlight(flight, Math.floor(Date.now()/ 1000), from, to).send({from: airline}, callback);
    }

    buyInsurance(flightKey, amt, callback) {
        let self = this;
        self.flightSuretyApp.methods.buy(flightKey).send({from: this.account, value: this.web3.utils.toWei(amt, 'ether'), gas: 999999999}, callback);
    }

    balance(passenger, callback) {
        let self = this;
        self.flightSuretyData.methods.withdrawals(passenger).call(callback);
    }

    pay(passenger, callback) {
        let self = this;
        self.flightSuretyData.methods.pay(passenger).send({from: self.owner}, (error, result) => {
            callback(error, result);
        });
    }

}