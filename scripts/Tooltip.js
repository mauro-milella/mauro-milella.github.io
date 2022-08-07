/*
This class is used to create a tooltip for each element that has a data-tooltip attribute.

E.g 
1) <h1 data-tooltip>Byte</h1> is recognized from Tooltip.js
2) data-tooltip value is updated as described in tips.json 
3) Now the frontend can show a popup upon hovering on <h1 data-tooltip="8 bits">Byte</h1>

This is the css needed to do that:

[data-tooltip]:before {
    content: attr(data-tooltip);
    position: absolute;
    opacity: 0;
    
    // Customize here
    transition: all 0.15s ease;
    padding: 10px;
    color: #333;
    border-radius: 10px;
    box-shadow: 2px 2px 1px silver;    
}

[data-tooltip]:hover:before {
    opacity: 1;
    
    // Customize here
    background: yellow;
    margin-top: -50px;
    margin-left: 20px;    
}

[data-tooltip]:not([data-tooltip-persistent]):before {
    pointer-events: none;
}
*/

const glossary = {
    "zettabytes": "one trillion gigabytes",
    "machine learning": "subfield of artificial intelligence, which is broadly defined as the capability of a machine to imitate intelligent human behavior",
    "dendrites": "branching extensions of a nerve cell, forming a dendrite tree. Branch density and grouping patterns are highly correlated to the function of the neuron itself",
    "sample": "set of attributes, a row in our dataset",
    "eta": "learning rate. This hyperparameter controls how much to change the model in response to a certain error",
    "epochs": "number of times the dataset is iterated over",
    "frank rosenblatt": "see Mark I Perceptron!",
    "learning rule": "function which improves a model performance when it's applied repeatedly",
    "adaline": "ADAptive LInear NEuron",
    "tedd hoff": "he was also Intel's employee number 12. lol",
    "adeline learning function": "Widrow-Hoff rule",
    "cost function": "parameter that defines how well a model is performing",
    "sse": "sum of squared errors",
    "memistors": "nanoelectric circuitry elements used in parallel computing memory technology"
};

class Tooltip {

    constructor(tips) {
        this.targets = [];
        this.tips = tips;
    }

    renew() {
        this.targets = document.querySelectorAll('[data-tooltip]');
        this.targets.forEach(element => {
            this.assignTip(element);
        });
    }

    assignTip(obj) {
        const key = obj.textContent.toLowerCase().replace(/\$|\\/g, '');
        if (key in glossary) {
            obj.setAttribute('data-tooltip', glossary[key]);
        }
        else {
            obj.removeAttribute('data-tooltip');
        }
    }
}

// Create a new tooltip instance
const tooltip = new Tooltip(glossary);
tooltip.renew();