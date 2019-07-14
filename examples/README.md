## Description

This script is designed to interface with the plugin to expose the web-based light. It supports RGB, RGBW (RGBWW) and single colour white/warm white. Read [below](#notes) for more information.
## Requirements

* NodeMCU

* 12v RGB LED Strip

* 12v-5v Converter (e.g. a USB car charger)

* 12v Power Supply

* 12v Power Jack

* 3x IRLZ44N

* 3x 510 Ω Resistors

* Pin header cables

* Micro-USB cable

**Note:** Do not use a linear voltage regulator like the [LM7805](https://www.sparkfun.com/datasheets/Components/LM7805.pdf) as they can become dangerously hot without sufficient cooling.

## How-to

1. Follow [this](https://gist.github.com/Tommrodrigues/8d9d3b886936ccea9c21f495755640dd) gist which walks you through how to flash a NodeMCU using the Arduino IDE. The `.ino` file referred to is the `NodeMCU-RGB.ino` file included in this repository.

2. Build the following circuit (Remember to **disconnect the NodeMCU** from the circuit whenever you are flashing it):

![Diagram](https://i.ibb.co/jGL6RFc/RGB-Diagram.jpg)

3. Assuming that you already have [homebridge](https://github.com/nfarina/homebridge#installation) set up, the next thing you will have to do is install the plugin:
```
npm install -g homebridge-web-rgb
```

4. Finally, update your `config.json` following the example below:

```json
"accessories": [
    {
        "accessory": "HTTP-RGB",
        "name": "RGB Strip",
        "apiroute": "rgb.local"
    }
]
```

## Notes

- If you have an `rgbw` or `rgbww` strip and you have correctly adapted the above wiring diagram to support this, you can set the `rgbw` variable to `true` in the `.ino` script and then use `D8` of the NodeMCU for this channel. Then, whenever you set the color to pure white (`FFFFFF`), the `RGB` LEDs will be turned off and the white one will be activated instead. No changes need to be made to your `config.json`.

- If your strip _only_ supports a white channel (no `rgb`) and you have correctly adapted the above wiring diagram for this, you can set the `rgbw` variable to `true` in the `.ino` script and then use `D8` of the NodeMCU for this channel (leave `hexString` as `FFFFFF`). You should then add `"enableColor": false` to the `config.json`. Now, HomeKit will only expose the brightness characteristic and not the color one.

- In the _HEX.md_ file included in this repository, you can find a selection of HEX colors to try out on your own RGB strips