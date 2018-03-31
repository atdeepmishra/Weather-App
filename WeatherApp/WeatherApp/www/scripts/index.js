var app = {
    initialize: function () {
        // Wait for device to be ready
        this.bindEvents();
        // Load Vue
        this.loadVue();
    },
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    },

    /**
    * Code for Vue and logic to handle user request
    */
    loadVue: function () {


        /**
         * Vue for User Authentication
         */
        var loginVue = new Vue({
            el: "#app-login",
            data: {
                loginPage: true,
                user: '',
                password: '',
                hasErr: false,
                errMsg: '',
            },

            methods: {
                authenticate: function () {
                    console.log("Inside authenticate function");
                    this.hasErr = false;
                    this.errMsg = '';
                    var self = this;
                    fetchJsonData('User.json', function (response) {
                        //Validate User
                        var users = JSON.parse(response);
                        var userIdMatched = false;
                        if (!self.user) {
                            self.errMsg = "User Id cannot be blank";
                            self.hasErr = true;
                            return;
                        } else if (!self.password) {
                            self.errMsg = "Password cannot be blank";
                            self.hasErr = true;
                            return;
                        } else {
                            for (var i = 0; i < users.length; i++) {
                                if (users[i].id == self.user) {
                                    userIdMatched = true;
                                    if (users[i].password == self.password) {
                                        self.hasErr = false;
                                        break;
                                    }
                                }
                                self.hasErr = true;
                            }
                        }
                        if (self.hasErr == false) {
                            // Move to Page 2 (Selection Page / Query Page)
                            self.loginPage = false;
                            setVue(2);
                        } else {
                            if (userIdMatched) {
                                self.errMsg = "Invalid Password";
                            } else {
                                self.errMsg = "Invalid User";
                            }
                        }
                    });
                },
                clearData: function () {
                    this.user = '';
                    this.password = '';
                    this.hasErr = false;
                    this.errMsg = '';
                }
            },

        });


        // Vue for Selection Page, Query Page and Weather Report Page
        var weatherVue = new Vue({
            el: "#app-weather",
            data: {
                appWeather: false,
                selectionPage: false,
                queryPage: false,
                weatherPage: false,
                errMsg: '',
                noDataFoundErr: false,
                noDataFoundErrMsg: '',
                weatherdata: {
                    current_observation: {
                        display_location: {},
                    }
                },
                selectedData: [],
                curPage: 0,
                zipcode: '',
            },
            computed: {
                //zipcode: getCurLocZip,
            },
            methods: {
                setup: function () {
                    this.selectionPage = true;
                },

                // Resets the data selected
                clearData: function () {
                    this.weatherdata = {
                        current_observation: {
                            display_location: {},
                        }
                    };
                    this.selectedData = [];
                    this.zipcode = '';
                    this.errMsg = '';
                    this.curPage = 0;
                    this.noDataFoundErrMsg = '';
                    this.noDataFoundErr = false;

                },

                // Moves back to selection page again
                returnHome: function () {
                    this.selectionPage = true;
                    this.queryPage = false;
                    this.weatherPage = false;
                    this.clearData();
                },

                // Moves back to selection page again
                returnToLogin: function () {
                    this.selectionPage = false;
                    this.clearData();
                    setVue(1);
                },

                /**
                * Function retrives the weather details by current location (Currently it is set to Buffalo (14214))
                */
                getByCurLoc: function () {
                    this.noDataFoundErr = false;
                    this.noDataFoundErrMsg = '';
                    var self = this;
                    getCurZipCode(function (zipcd) {

                        self.curPage = 0;
                        console.log(zipcd);
                        if (typeof zipcd !== "undefined" && zipcd !== null && zipcd !== '') {
                            self.zipcode = zipcd;
                        } else {
                            // For now hardcoding the zipcode to buffalo
                            self.zipcode = 14214;
                        }
                        console.log(self.zipcode);
                        // Fetch record and filter by zipcode
                        // This code can be easily modified if there is need to get the data from API
                        fetchJsonData('weather_data.json', function (response) {
                            //Get the full data
                            var data = JSON.parse(response);
                            //Filter the record
                            console.log(self.zipcode);
                            var records = data.filter(function (obj) {
                                return obj.zip_code === parseInt(self.zipcode);
                            });
                            //Throw error if data not found and provide details
                            if (records.length == 0) {
                                self.noDataFoundErr = true;
                                self.noDataFoundErrMsg = "No data found for your location!!";
                                self.zipcode = ''; // Clearing it so that it doesn't create confilict with query page
                                return;
                            } else {
                                self.selectedData = records;
                                self.weatherdata = records[0];
                                self.selectionPage = false;
                                self.weatherPage = true;
                            }
                        });
                    });
                },

                /**
                *  Function for enabling the page to query by zipcode
                */
                getByZipCd: function () {
                    this.selectionPage = false;
                    this.queryPage = true;
                },

                /**
                * Function to get the Weather details using the user provided zipcode
                */
                getWeather: function () {
                    //var zipCdInt = parseInt(this.zipcode);
                    if (this.zipcode == '') {
                        this.errMsg = "Please provide a zip code";
                        return;
                    }
                    this.errMsg = '';
                    this.curPage = 0;
                    var self = this;
                    fetchJsonData('weather_data.json', function (response) {
                        //Get the full data
                        var data = JSON.parse(response);
                        //Filter the record
                        var records = data.filter(function (obj) {
                            return obj.zip_code === parseInt(self.zipcode);
                        });
                        if (records.length == 0) {
                            self.errMsg = "No data found for entered zip";
                        } else {
                            self.selectedData = records;
                            self.weatherdata = records[0];
                            self.queryPage = false;
                            self.weatherPage = true;
                        }
                    });
                },

                // Set the data to next day if available
                nextDayData: function () {
                    if (this.curPage < this.selectedData.length - 1)
                        this.weatherdata = this.selectedData[++this.curPage];
                },

                // Set the data to next day if available
                prevDayData: function () {
                    if (this.curPage > 0) {
                        this.weatherdata = this.selectedData[--this.curPage];
                    }
                },

                /**
                *  Function to move to next page - if user doesn't know the zipcode of location
                *  and wants to search through whole data
                */
                proceed: function () {
                    this.selectionPage = false;
                    this.appWeather = false;
                    setVue(3);
                },
            }
        });


        /**
         * Vue for Weather Grid and Popup
         */
        var weatherGridVue = new Vue({
            el: "#wdatagrid",
            data: {
                wdatagrid: false,
                currentPage: 0,
                pageSize: 12,
                pageData: [],
                filterDataCount: 0,
                isLastPage: false,
                tableHeadings: [
                    { name: 'Location', value: 'current_observation.display_location.city' },
                    { name: 'Temp', value: 'current_observation.temp_f' },
                    { name: 'ZIP', value: 'current_observation.display_location.zip' },
                    { name: 'State', value: 'current_observation.display_location.state_name' },
                    { name: 'Date', value: 'current_observation.observation_time_rfc822' },

                ],
                fullWeatherData: [],
                filteredData: [],
                showModal: false,
                showmask: false,
                weatherdata: {
                    current_observation: {
                        display_location: {},
                    }
                },
                searchloc: '',
                searchzip: '',
                searchdate: '',
                searchtemp: '',
            },

            methods: {
                setup: function () {
                    // Setup data
                    this.getData();
                },

                /**
                * Retrieves the data and set the data variables for grid vue
                */
                getData: function () {
                    var self = this;
                    fetchJsonData('weather_data.json', function (response) {
                        //Get the full data
                        var data = JSON.parse(response);
                        //alert(data);
                        self.fullWeatherData = data;
                        self.filteredData = data;
                        self.setPageData();
                    });
                },

                /**
                * Function will set the next page of grid
                */
                nextPage: function () {
                    if ((this.currentPage * this.pageSize) < this.filteredData.length) {
                        this.currentPage++;
                        this.setPageData();
                        this.isLastPage = false;
                    } else {
                        this.isLastPage = true;
                    }
                },

                /**
                *  Function will move to previous page of grid
                */
                prevPage: function () {
                    if (this.currentPage > 0) {
                        this.currentPage--;
                        this.setPageData();
                        this.isLastPage = false;
                    }
                },

                /**
                * Function will set the current page data of grid
                */
                setPageData: function () {
                    var startIndex = this.currentPage * this.pageSize;
                    var endIndex = startIndex + this.pageSize;
                    this.pageData = this.filteredData.slice(startIndex, endIndex);
                },

                /**
                * Function will set the data for showing in popup model (It will
                * show the detailed data for selected record in the grid )
                */
                showDetails: function (row) {
                    //alert("showing");
                    this.weatherdata = row;
                    this.showModal = true;
                    this.showmask = true;
                },

                /**
                * Filters the data based on the search made by user on the weather grid
                */
                applyFilters: function () {
                    if (this.searchloc == '' && this.searchzip == '' && this.searchdate == '' && this.searchtemp == '') {
                        this.filteredData = this.fullWeatherData;
                        //Reset back to originaldata
                    } else {
                        var self = this
                        // Below logic filters the data based on search keys (anything key match will be considered as the match case) 
                        // the four search criteria applies with or logic ( searchloc or searchzip or searchdate or searchtemp )
                        this.filteredData = this.fullWeatherData.filter(function (obj) {
                            if (obj.current_observation != undefined
                                && obj.current_observation.display_location != undefined) {

                                if (self.searchloc != '' && obj.current_observation.display_location.city != null && obj.current_observation.display_location.city.toLowerCase().match(self.searchloc.toLowerCase())) {
                                    return true;
                                }
                                if (self.searchzip != '' && obj.current_observation.display_location.zip != null && obj.current_observation.display_location.zip.toLowerCase().match(self.searchzip.toLowerCase())) {
                                    return true;
                                }
                                //if (self.searchstate != '' && obj.current_observation.display_location.state_name != null && obj.current_observation.display_location.state_name.toLowerCase().match(self.searchstate.toLowerCase())) {
                                //    return true;
                                //}
                                if (self.searchdate != '' && obj.current_observation.observation_time_rfc822 != null && obj.current_observation.observation_time_rfc822.slice(0, 17).toLowerCase().match(self.searchdate.toLowerCase())) {
                                    return true;
                                }
                                if (self.searchtemp != '' && obj.current_observation.temp_f != null && obj.current_observation.temp_f.toString().toLowerCase().match(self.searchtemp.toLowerCase())) {
                                    return true
                                }
                                return false;
                            } else {
                                return false;
                            }
                        });

                    }
                    this.currentPage = 0;
                    this.setPageData();
                },

                // Resets the data selected
                clearData: function () {
                    this.fullWeatherData = [];
                    this.filteredData = [];
                    this.weatherdata = {
                        current_observation: {
                            display_location: {},
                        }
                    };
                    this.searchloc = '';
                    this.searchzip = '';
                    this.searchdate = '';
                    this.searchtemp = '';
                    this.currentPage = 0;
                    this.pageData = [];
                    this.filterDataCount = 0;
                    this.isLastPage = false;
                },

                // Moves back to selection page again
                returnHome: function () {
                    this.wdatagrid = false;
                    this.clearData();
                    setVue(2);
                },
            }
        });

        /**
         * Function to enable the current vue
         * @param {any} page
         */
        var setVue = function (page) {
            if (page == 2) {
                weatherVue.appWeather = true;
                weatherVue.setup();
            } else if (page == 3) {
                weatherGridVue.wdatagrid = true;
                weatherGridVue.setup();
            } else if (page == 1) {
                loginVue.loginPage = true;
                loginVue.clearData();
            }
        }

    }
};
app.initialize();


/**
 * Function to fetch the data from json files (Users.json and weather_data).
 *
 * @param {any} file
 * @param {any} callback
 */
function fetchJsonData(file, callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'www/asset/' + file, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            return callback(xobj.responseText);
        }
    }
    xobj.send(null);
}


/**
 * Function gets the zipcode for the logged in user based on this current position.
 * It first gets the long and latitude of the user then calls api to fetch its zipcode
 * @param {any} cb
 */
getCurZipCode = function getCurZipCode(cb) {
    if (document.location.protocol === 'http:' && (navigator.geolocation != null)) {
        return navigator.geolocation.getCurrentPosition(function (pos) {

            //The below code return the current location zip code - however it mostly fails depending on user location 
            // setting and the also based on our data. To avoid repeated call to the api  return from function.
            // To see this functionality. uncomment the below line. It will retrieve the zip code of location and 
            // show the data for that zipcode if it is found in our (weather_data.json file).

            return cb('');   // returning empty string will enable the code to put the default zip-code as 14214.

            var coords, url;
            coords = pos.coords;
            var xmlDoc = new XMLHttpRequest();

            // Method one - OpenStreetMap api call to get zipcode from lon and lat. But it fails if called the api frequently
            url = "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + coords.latitude + "&lon=" + coords.longitude + "&addressdetails=1";
            xmlDoc.open('GET', url, true);
            xmlDoc.onreadystatechange = function () {
                if (xmlDoc.readyState === 4 && xmlDoc.status === 200) {
                    //console.log(xmlDoc);
                    if (typeof xmlDoc.response !== "undefined" && xmlDoc.response !== null) {
                        var response = JSON.parse(xmlDoc.response);
                        if (typeof response.address !== "undefined" && response.address !== null) {
                            return cb(response.address.postcode);
                        }
                    }
                }
                return cb('');
            }



            //Method two - google api to get geocode using lon and lat and get the zipcode - but is mostly gives error as query overlimit reacheds
            /*url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + coords.latitude + "," + coords.longitude + "&sensor=true";
            console.log("nowready");
            xmlDoc.open('GET', url, true);
            xmlDoc.onreadystatechange = function () {
                if (xmlDoc.readyState === 4 && xmlDoc.status === 200) {
                    if (typeof xmlDoc.response !== "undefined" && xmlDoc.response !== null) {
                        var response = JSON.parse(xmlDoc.response);
                        if (response.result && response.result[0]) {
                            var res = response.result[0];
                            for (var i = 0; i < res.address_components.length; i++) {
                                var types = res.address_components[i].types;
                                for (var typeIdx = 0; typeIdx < types.length; typeIdx++) {
                                    if (types[typeIdx] == 'postal_code') {
                                        return cb(res.address_components[i].short_name);
                                    }
                                }
                            }
                        }
                    }
                }
                return cb('');
            }*/


            xmlDoc.send();
        });
    }
};
