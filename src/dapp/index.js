
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    let f = [];
    let flights = new Map();
    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
/*
        // User-submitted transaction
        DOM.elid('get-flight-status').addEventListener('click', () => {
            let flightKey = DOM.elid('flights-select2').selectedIndex; 
            // Write transaction
            contract.fetchFlightStatus(flightKey, (error, result) => {
                display('get-flight-status', 'get-flight-status', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
*/
        //--------------------------------------------------

        contract.fundAirline("0xCF1E5437E08FE485C6DCde6bee96ccd0735000E6", (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Airline funded sucessfully..");
                    alert("Airline funded sucessfully..");
                }
                
        });

        contract.registerFlight("0xCF1E5437E08FE485C6DCde6bee96ccd0735000E6", "1", "loc1", "loc2", (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Flight registered sucessfully..");
                    alert("Flight registered sucessfully..");
                }
                
            });

        DOM.elid('register-airline-btn').addEventListener('click', () => {
            let airlineAddress = DOM.elid('register-airline-address').value;
            // Write transaction
            contract.registerAirline(airlineAddress, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Airline Registerd sucessfully..");
                    alert("Airline Registerd sucessfully..");
                }
                
            });
        })


        DOM.elid('fund-airline-btn').addEventListener('click', () => {
            let airlineAddress = DOM.elid('register-airline-address').value;
            // Write transaction
            contract.fundAirline(airlineAddress, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Airline funded sucessfully..");
                    alert("Airline funded sucessfully..");
                }
                
            });
        })

        DOM.elid('register-flight-btn').addEventListener('click', () => {
            let airline = DOM.elid('register-flight-airline').value;
            let flight = DOM.elid('register-flight').value;
            let from = DOM.elid('register-flight-from').value;
            let to = DOM.elid('register-flight-to').value;
            // Write transaction
            contract.registerFlight(airline, flight, from, to, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Flight registered sucessfully..");
                    alert("Flight registered sucessfully..");
                }
                
            });
        })

        DOM.elid('get-flights').addEventListener('click', () => {
            // Write transaction
            contract.getFlights((error, result) => {
                if (error) {
                    console.log(error);
                    alert("Error!!!");
                } else{
                    for(element in result)
                    {
                        let newSelect = DOM.elid('select-flight');
                        var opt = document.createElement("option");
                        opt.value= element.flightKey;
                        opt.innerHTML = 'flight from ' + element.from + ' to ' + element.to; // whatever property it has

                        // then append it to the select element
                        newSelect.appendChild(opt);
                    }
                    console.log("Flight registered sucessfully..");
                    alert("Flight registered sucessfully..");
                }
                
            });
        })

        DOM.elid('fund-airline-btn').addEventListener('click', () => {
            let airlineAddress = DOM.elid('register-airline-address').value;
            // Write transaction
            contract.fundAirline(airlineAddress, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!!!");
                }else{
                    console.log("Airline funded sucessfully..");
                    alert("Airline funded sucessfully..");
                }
                
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('insurance-flight-name').value;
            let insuredAmount = DOM.elid('insurance-amount').value;
            // Write transaction
            contract.buyInsurance(flight, insuredAmount, (error, result) => {
                if(error) {
                    console.log(error);
                    alert("Error!");
                } else {
                    console.log("Flight Insured Succesfully" + result);
                    alert("Flight Insured Succesfully: " + result);
                }
            });
        })

        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('insurance-flight-name').value;
            let airline = DOM.elid('insurence-airline-name').value;

            // Write transaction
            contract.fetchFlightStatus(flight, airline, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('remaining-balance').addEventListener('click', () => {
            let passenger = DOM.elid('passenger-address').value;

            // Write transaction
            contract.balance(passenger, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error!");
                }else{
                    DOM.elid('balance-amount').innerText  = result + ' ether';
                }
                
            });
        })
        
        DOM.elid('withdraw').addEventListener('click', () => {
            let passenger = DOM.elid('passenger-address').value;

            contract.pay(passenger, (error, result) => {
                if(error){
                    console.log(error);
                    alert("Error");
                }else{
                    alert("Withdrawal Succesfully: " + result);
                }
            });
        });
    
    });


})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, false ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







