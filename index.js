var Service, Characteristic;
var request = require('request');
var convert = require('color-convert');

module.exports = function(homebridge){
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-web-rgb', 'HTTP-RGB', HTTP_RGB);
};

function HTTP_RGB(log, config) {

    this.log = log;

    this.name = config.name || 'RGB Light';
    this.apiroute = config.apiroute || '';
    this.pollInterval = config.pollInterval || 60;

    this.manufacturer = config.manufacturer || 'HTTP Manufacturer';
    this.model = config.model || 'homebridge-web-rgb';
    this.serial = config.serial || 'HTTP Serial Number';

    this.username = config.username || null;
  	this.password = config.password || null;
    this.timeout = config.timeout || 5000;
    this.http_method = config.http_method || 'GET';

    this.cache = {};
    this.cacheUpdated = false;
    this.cache.hue = 0;
    this.cache.saturation = 0;

    if(this.username != null && this.password != null){
      this.auth = {
        user : this.username,
        pass : this.password
      };
    }

    this.service = new Service.Lightbulb(this.name);
}

HTTP_RGB.prototype = {

  identify: function(callback) {
      this.log('Identify requested!');
      callback();
  },

  _httpRequest: function (url, body, method, callback) {
      request({
          url: url,
          body: body,
          method: this.http_method,
          timeout: this.timeout,
          rejectUnauthorized: false,
          auth: this.auth
      },
          function (error, response, body) {
              callback(error, response, body);
          });
  },

  _getStatus: function(callback) {
    this.log("[+] Getting status:", this.apiroute+"/status");
    var url = this.apiroute+"/status";
    this._httpRequest(url, '', 'GET', function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error getting status: %s", error.message);
  				callback(error);
        } else {
          this.log("[*] Device response: ", responseBody);
  				var json = JSON.parse(responseBody);
          var hsv = convert.hex.hsv(json.currentColor);
          this.cache.hue = hsv[0];
          this.cache.saturation = hsv[1];
          this.service.getCharacteristic(Characteristic.On).updateValue(json.currentState);
          this.log("[*] Updated state:", json.currentState);
          this.service.getCharacteristic(Characteristic.Brightness).updateValue(json.currentBrightness);
          this.log("[*] Updated brightness:", json.currentBrightness);
          this.service.getCharacteristic(Characteristic.Hue).updateValue(this.cache.hue);
          this.log("[*] Updated hue:", this.cache.hue);
          this.service.getCharacteristic(Characteristic.Saturation).updateValue(this.cache.saturation);
          this.log("[*] Updated hue:", this.cache.saturation);
  				callback();
    }}.bind(this));
  },

  setOn: function(value, callback) {
    this.log("[+] Setting state with:", this.apiroute+"/setState/"+value);
    var url = this.apiroute+"/setState/"+value;
    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error setting state", error.message);
  				callback(error);
        } else {
          this.log("[*] Sucessfully set state to %s", value);
  				callback();
        }
    }.bind(this));
  },

  setBrightness: function(value, callback) {
    this.log("[+] Setting brightness:", this.apiroute+"/setBrightness/"+value);
    var url = this.apiroute+"/setBrightness/"+value;
    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        if (error) {
          this.log("[!] Error setting brightness", error.message);
  				callback(error);
        } else {
          this.log("[*] Sucessfully set brightness to %s", value);
  				callback();
        }
    }.bind(this));
  },

  setHue: function(value, callback) {
    this.log("[*] Setting hue to:", value);
    this.cache.hue = value;
    if (this.cacheUpdated) {
        this._setRGB(callback);
    } else {
        this.cacheUpdated = true;
        callback();
    }
  },

  setSaturation: function(value, callback) {
    this.log("[*] Setting saturation to:", value);
    this.cache.saturation = value;
    if (this.cacheUpdated) {
        this._setRGB(callback);
    } else {
        this.cacheUpdated = true;
        callback();
    }
  },

  _setRGB: function(callback) {
    var hex = convert.hsv.hex(this.cache.hue, this.cache.saturation, 100);

    var url = this.apiroute+"/setColor/"+hex;
    this.cacheUpdated = false;

    this.log("[+] Setting color:", this.apiroute+"/setColor/"+hex);
    this._httpRequest(url, '', this.http_method, function(error, response, body) {
        if (error) {
            this.log('[!] Error setting color: %s', error);
            callback(error);
        } else {
            this.log('[*] Successfully set color to:', hex);
            callback();
        }
    }.bind(this));
  },

    getServices: function() {

    this.informationService = new Service.AccessoryInformation();
    this.informationService
		  .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
		  .setCharacteristic(Characteristic.Model, this.model)
		  .setCharacteristic(Characteristic.SerialNumber, this.serial);

		this.service
			.getCharacteristic(Characteristic.On)
			.on('set', this.setOn.bind(this));

    this.service
			.getCharacteristic(Characteristic.Brightness)
			.on('set', this.setBrightness.bind(this));

		this.service
			.getCharacteristic(Characteristic.Saturation)
			.on('set', this.setSaturation.bind(this));

		this.service
			.getCharacteristic(Characteristic.Hue)
			.on('set', this.setHue.bind(this));

    this._getStatus(function() {
    }.bind(this));

    setInterval(function() {
      this._getStatus(function() {
      }.bind(this));
    }.bind(this), this.pollInterval * 1000);

    return [this.informationService, this.service];
  }

};
