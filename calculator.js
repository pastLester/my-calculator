const mainCalc = document.querySelector("#calculator");
const inputDisplay = document.querySelector("#history");
const outputDisplay = document.querySelector("#result");
const allClear = document.querySelector('[data="all-clear"]');
const backButton = document.querySelector('[data="backspace"]');
const percentButton = document.querySelector('[data="percent"]');
const negateButton = document.querySelector('[data="negate"]');
const decimalButton = document.querySelector('[data="dot"]');
const equalsButton = document.querySelector('[data="calculate"]');
const operationButtons = document.querySelectorAll("[data-operator]");
const numberButtons = document.querySelectorAll("[data-number]");
const btnShow = document.querySelector("#startbtn");
const btnExit = document.querySelector("#exitbtn");
const precisionRange = document.querySelector("#precision-range");
const precisionLabel = document.querySelector("#precision-meter");

let PRECISION = 500;

precisionRange.addEventListener("input", (event) => {
  PRECISION = parseInt(event.target.value);
  precisionLabel.innerHTML = "Precision : " + PRECISION;
});

btnExit.onclick = (e) => {
  document.exitFullscreen();
};

// for fullscreen
function fullscreen() {
  btnExit.style.display = "none";
  mainCalc.style.display = "none";
  btnShow.style.display = "block";
  btnShow.onclick = (evnt) => {
    mainCalc.style.display = "block";
    btnShow.style.display = "none";
    document.documentElement.requestFullscreen();
    btnExit.style.display = "block";
  };
}

if (document.addEventListener) {
  document.addEventListener("fullscreenchange", exitHandler, false);
  document.addEventListener("mozfullscreenchange", exitHandler, false);
  document.addEventListener("MSFullscreenChange", exitHandler, false);
  document.addEventListener("webkitfullscreenchange", exitHandler, false);
} else {
  alert("Your browser is not supported !");
}

fullscreen();

function exitHandler() {
  if (document.webkitIsFullScreen === false) {
    fullscreen();
  } else if (document.mozFullScreen === false) {
    fullscreen();
  } else if (document.msFullscreenElement === false) {
    fullscreen();
  }
}

////////// BIG RATIONAL CLASS /////////////

Math.abs = (x) => {
  if (x < 0) return -x;
  return x;
};

Math.gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  var t;
  while (b != 0n) {
    t = b;
    b = a % b;
    a = t;
  }
  return a;
};

const BigRational = class BigRational {
  constructor(num, den, spe) {
    this.num = num;
    this.den = den;
  }

  negate() {
    return new BigRational(-this.num, this.den).reduce();
  }

  sign() {
    return this.num == 0n
      ? 0
      : this.num > 0 && this.den > 0
      ? 1
      : this.num < 0 && this.den < 0
      ? 1
      : -1;
  }

  reduce0() {
    var d = Math.gcd(this.num, this.den);
    if (d == 0) return this;
    return new BigRational(this.num / d, this.den / d);
  }

  reduce() {
    return this.reduce0().withPosDen();
  }

  withPosDen() {
    return new BigRational(
      Math.abs(this.num) * BigInt(this.sign()),
      Math.abs(this.den)
    );
  }

  reciprocal() {
    return new BigRational(this.den, this.num).reduce();
  }

  add(other) {
    return new BigRational(
      this.num * other.den + this.den * other.num,
      this.den * other.den
    ).reduce();
  }

  subtract(other) {
    return this.add(other.negate());
  }

  multiply(other) {
    return new BigRational(this.num * other.num, this.den * other.den).reduce();
  }

  divide(other) {
    return this.multiply(other.reciprocal());
  }

  toString(decimals) {
    if (this.num == this.den && this.num == 0) return "UNDEFINED";
    if (this.sign() == 0) return "0";
    if (this.den == 0n)
      return this.num == 0 ? "NaN" : this.num > 0n ? "" : "-" + "INFINITY";
    if (decimals == undefined) {
      return `${this.num} / ${this.den}`;
    }
    var res = "";
    var n = Math.abs(this.num),
      d = Math.abs(this.den),
      t,
      i = 0;
    while (i < decimals + 1 && n > 0n) {
      t = n / d;
      res += t.toString();
      if (i == 0) res += ".";
      n -= t * d;
      n *= 10n;
      i++;
    }
    while ((res.endsWith("0") && res.includes(".")) || res.endsWith("."))
      res = res.substring(0, res.length - 1);
    return (this.sign() == -1 ? "-" : "") + res;
  }
};

BigRational.parse = (str) => {
  if (str.startsWith("-")) return BigRational.parse(str.substring(1)).negate();
  for (var u = 0; u < str.length; u++)
    if (!"0123456789.".includes(str.charAt(u) + "")) return;
  str = str.toString();
  var pos = str.lastIndexOf("."),
    inte,
    deci;
  if (pos < 0) {
    return new BigRational(BigInt(str), 1n);
  }
  inte = str.substring(0, pos);
  deci = str.substring(pos + 1, str.length);
  return new BigRational(BigInt(inte), 1n)
    .add(new BigRational(BigInt(deci), 10n ** BigInt(deci.length)))
    .reduce();
};

//////// CALCULATOR CLASS ///////

const Calculator = class Calculator {
  constructor(inputDisplay, outputDisplay) {
    this.inp = inputDisplay;
    this.out = outputDisplay;
    this.inHist = [];
  }

  clearAllHistory() {
    this.inHist = [];
    this.updateInputDisplay();
    this.updateOutputDisplay("0");
  }

  backspace() {
    switch (this.getLastInputType()) {
      case "number":
        if (this.getLastInputValue() > 1) {
          this.editLastInput(this.getLastInputValue().slice(0, -1), "number");
        } else {
          this.deleteLastInput();
        }
        break;
      case "operator":
        this.deleteLastInput();
        break;
      default:
        return;
    }
  }

  insertNumber(value) {
    if (this.getLastInputType() === "number") {
      this.appendToLastInput(value);
    } else if (["operator", null].includes(this.getLastInputType())) {
      this.addNewInput(value, "number");
    } else {
      this.clearAllHistory();
      this.insertNumber(value);
    }
  }

  insertOperation(value) {
    switch (this.getLastInputType()) {
      case "number":
        this.addNewInput(value, "operator");
        break;
      case "operator":
        this.editLastInput(value, "operator");
        break;
      case "equals":
        let output = this.getOutputValue();
        this.clearAllHistory();
        this.addNewInput(output, "number");
        this.addNewInput(value, "operator");
        break;
      default:
        return;
    }
  }

  negateNumber() {
    if (this.getLastInputType() === "number") {
      this.editLastInput(
        BigRational.parse(this.getLastInputValue()).negate(),
        "number"
      );
    }
  }

  enterPoint() {
    if (
      this.getLastInputType() === "number" &&
      !this.getLastInputValue().includes(".")
    ) {
      this.appendToLastInput(".");
    } else if (["operator", null].includes(this.getLastInputType())) {
      this.addNewInput("0.", "number");
    }
  }

  generateResult() {
    if (["operator", "equals"].includes(this.getLastInputType())) return;
    const self = this;
    const simplifyExpression = (currExpr, operator) => {
      if (currExpr.indexOf(operator) < 0) {
        return currExpr;
      } else {
        let opInd = currExpr.indexOf(operator);
        let leftOpIdx = opInd - 1;
        let rightOpIdx = opInd + 1;
        let partialSol = self.performOperation(
          ...currExpr.slice(leftOpIdx, rightOpIdx + 1)
        );
        if ([null, undefined].includes(partialSol)) partialSol = "";
        currExpr.splice(leftOpIdx, 3, partialSol.toString(PRECISION * 3));
        return simplifyExpression(currExpr, operator);
      }
    };
    let result = ["*", "/", "+", "-"].reduce(
      simplifyExpression,
      this.getAllInputValues()
    );
    this.addNewInput("=", "equals");
    this.updateOutputDisplay(result.toString(PRECISION));
  }

  performOperation(left, operator, right) {
    //if (isNaN(left) || isNaN(right)) return;
    switch (operator) {
      case "*":
        return BigRational.parse(left).multiply(BigRational.parse(right));
      case "/":
        return BigRational.parse(left).divide(BigRational.parse(right));
      case "+":
        return BigRational.parse(left).add(BigRational.parse(right));
      case "-":
        return BigRational.parse(left).subtract(BigRational.parse(right));
      default:
        return;
    }
  }

  changePercentToDecimal() {
    if (this.getLastInputType() === "number") {
      this.editLastInput(
        BigRational.parse(this.getLastInputValue().toString()).divide(
          BigRational.parse("100")
        ),
        "number"
      );
    }
  }

  getAllInputValues() {
    return this.inHist.map((entry) => entry.value);
  }

  updateInputDisplay() {
    let val = "",
      pstr = (inp) => {
        if (inp.startsWith("-")) inp = "(" + inp + ")";
        return inp;
      };
    for (var i = 0; i < this.inHist.length; i++) {
      val +=
        " " +
        (this.inHist[i].type === "number"
          ? pstr(this.inHist[i].value.toString(PRECISION))
          : this.inHist[i].value.toString());
    }
    this.inp.value = val.substring(1);
  }

  updateOutputDisplay(value) {
    var q = BigRational.parse(value);
    this.out.value = q == undefined ? "UNDEFINED" : q.toString(PRECISION);
  }

  getLastInputType() {
    return this.inHist.length == 0
      ? null
      : this.inHist[this.inHist.length - 1].type;
  }

  getLastInputValue() {
    return this.inHist.length == 0
      ? null
      : this.inHist[this.inHist.length - 1].value;
  }

  getOutputValue() {
    return this.out.value;
  }

  addNewInput(value, type) {
    this.inHist.push({ value: value.toString(PRECISION), type: type });
    this.updateInputDisplay();
  }

  appendToLastInput(value) {
    this.inHist[this.inHist.length - 1].value += value.toString(PRECISION);
    this.updateInputDisplay();
  }

  editLastInput(value, type) {
    this.deleteLastInput();
    this.addNewInput(value, type);
  }

  deleteLastInput() {
    this.inHist.pop();
    this.updateInputDisplay();
  }
};

const calculator = new Calculator(inputDisplay, outputDisplay);

allClear.addEventListener("click", (event) => {
  calculator.clearAllHistory();
});

backButton.addEventListener("click", (event) => {
  calculator.backspace();
});

percentButton.addEventListener("click", (event) => {
  calculator.changePercentToDecimal();
});

negateButton.addEventListener("click", (event) => {
  calculator.negateNumber();
});

decimalButton.addEventListener("click", (event) => {
  calculator.enterPoint();
});

equalsButton.addEventListener("click", (event) => {
  calculator.generateResult();
});

operationButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    calculator.insertOperation(event.target.dataset.operator);
  });
});

numberButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    calculator.insertNumber(event.target.dataset.number);
  });
});
