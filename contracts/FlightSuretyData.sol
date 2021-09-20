pragma solidity ^0.5.10;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 funds;
    }

    mapping(address => Airline) private airlines;
    uint registeredAirlines;

    struct Flight {
        bool isRegistered;
        string from;
        string to;
        address airline;
        uint status;
    }

    struct Claim {
        address passenger;
        uint256 purchaseAmt;
        uint payout;
        bool paidStatus;
    }

    mapping(bytes32 => Flight) public flights;
    bytes32[] public registeredFlights;

    mapping(bytes32 => Claim[]) public flightClaims;

    mapping(address => uint256) public withdrawals;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor (address airlineAddr) public 
    {
        contractOwner = msg.sender;
        airlines[airlineAddr] = Airline(true, false, 0);
        registeredAirlines = 1;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline);
    event AirlineFunded(address airline);
    event Paid(address recipient, uint256 amt);
    event Credited(bytes32 flight, address passenger, uint256 amt);
    event FlightRegistered(bytes32 flight);
    event ProcessedFlightStatus(bytes32 flight, uint status);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier onlyRegisteredFlight(bytes32 flight) {
        require(flights[flight].isRegistered, "Flight is not registered");
        _;
    }

    modifier onlyNonRegisteredFlight(bytes32 flight) {
        require(!flights[flight].isRegistered, "Flight is not registered");
        _;
    }

    modifier onlyRegisteredAirline(address airline) {
        require(airlines[airline].isRegistered, "Airline is not registered");
        _;
    }

    modifier onlyNonRegisteredAirline(address airline) {
        require(!airlines[airline].isRegistered, "Airline is already registered");
        _;
    }

    modifier onlyFundedAirline(address airline) {
        require(airlines[airline].isFunded, "Airline is not funded");
        _;
    }

    modifier onlyNonFundedAirline(address airline) {
        require(!airlines[airline].isFunded, "Airline is already funded");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function getRegisteredAirlineCount() public requireIsOperational view returns(uint256) {
        return registeredAirlines;
    }

    function getRegisteredFlightCount() public requireIsOperational view returns(uint256) {
        return registeredFlights.length;
    }

    function isAirlineRegistered (address airline) public view requireIsOperational returns(bool) {
        return airlines[airline].isRegistered;
    }

    function isAirlineFunded (address airline) public view requireIsOperational returns(bool) {
        return airlines[airline].isFunded;
    }

    function isFlightRegistered (bytes32 flight) public view requireIsOperational returns(bool) {
        return flights[flight].isRegistered;
    }

    function hasFlightLanded (bytes32 flight) public view returns(bool) {
        if (flights[flight].status > 0) 
            return true;
        return false; 
    }

    function getAirlineFunds(address airline) public view returns(uint256) {
        return airlines[airline].funds;
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                address airline,
                                address originalAirline
                            )
                            external
                            requireIsOperational
                            onlyNonRegisteredAirline(airline)
                            onlyFundedAirline(originalAirline)
    {
        airlines[airline] = Airline(true, false, 0);
        registeredAirlines++;
        emit AirlineRegistered(airline);
    }

    function fundAirline
                            (   
                                address airline,
                                uint256 amt
                            )
                            external
                            requireIsOperational
                            onlyRegisteredAirline(airline)
                            onlyNonFundedAirline(airline)
    {
        airlines[airline].isFunded = true;
        airlines[airline].funds = airlines[airline].funds.add(amt);

        emit AirlineFunded(airline);
    }

    function registerFlight
                            (   
                                bytes32 flightKey,
                                address airline,
                                string calldata from,
                                string calldata to
                            )
                            external
                            requireIsOperational
                            onlyNonRegisteredFlight(flightKey)
    { 
   //     bytes32 flightKey = getFlightKey(airline, flight, landing);
        flights[flightKey] = Flight(true, from, to, airline, 0);
        registeredFlights.push(flightKey);
        emit FlightRegistered(flightKey);
    }

    function processFlightStatus(address airline, string calldata flight, uint256 timestamp, uint status) external requireIsOperational {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(!hasFlightLanded(flightKey), "Flight has already landed");

        if(flights[flightKey].status == 0) {
            flights[flightKey].status = status;
        }
        if(flights[flightKey].status == 20) {
            creditInsurees(flightKey);
        }

        emit ProcessedFlightStatus(flightKey, status);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (  
                                bytes32 flight,
                                address passenger,
                                uint256 amt,
                                uint payout                           
                            )
                            external
                            payable
                            requireIsOperational
    {
        require(isFlightRegistered(flight));
        flightClaims[flight].push(Claim(passenger, amt, payout, false));
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    bytes32 flight
                                )
                                internal
                                requireIsOperational
    {
        for (uint i=0; i <= flightClaims[flight].length; i++) {
            flightClaims[flight][i].paidStatus = true;
            uint256 creditAmt = flightClaims[flight][i].purchaseAmt.mul(flightClaims[flight][i].payout).div(100);
            withdrawals[flightClaims[flight][i].passenger] = withdrawals[flightClaims[flight][i].passenger].add(creditAmt);

            emit Credited(flight, flightClaims[flight][i].passenger, creditAmt);
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address payable passenger
                            )
                            external
                            payable
    {
        uint256 amt = withdrawals[passenger];
        withdrawals[passenger] = 0;
        passenger.transfer(amt);

        emit Paid(passenger, amt);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}
