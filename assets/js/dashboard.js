function copyText(id) {
    var input = document.createElement('input');
    input.id = 'temp_element'

    input.style.height = 0

    document.body.appendChild(input)

    input.value = document.getElementById(id).innerText

    var selector = document.querySelector('#temp_element')

    selector.select()
    selector.setSelectionRange(0, 99999);
    document.execCommand('copy');
    // Remove the textarea
    document.body.removeChild(input)
}

let inputMNT = document.getElementById('MNT-conversion-input');

inputMNT.addEventListener('keypress', function() {
    document.getElementById('MNT-to-BTC').textContent = calculateMNT(inputMNT,)
})



function calculateMNT(input, cryptocurrency) {
    return input * 0.06 / cryptocurrency;
}

var lockIn = document.getElementById('lock-in');

lockIn.addEventListener('submit', function (event) {
    event.preventDefault();

    var BTCPriceInput = document.createElement('input');
    BTCPriceInput.setAttribute('type', 'hidden');
    BTCPriceInput.setAttribute('name', 'prices[BTC]');
    BTCPriceInput.setAttribute('value', document.getElementById('BTC-price').innerText);

    var ETHPriceInput = document.createElement('input');
    ETHPriceInput.setAttribute('type', 'hidden');
    ETHPriceInput.setAttribute('name', 'prices[ETH]');
    ETHPriceInput.setAttribute('value', document.getElementById('ETH-price').innerText);

    var LTCPriceInput = document.createElement('input');
    LTCPriceInput.setAttribute('type', 'hidden');
    LTCPriceInput.setAttribute('name', 'prices[LTC]');
    LTCPriceInput.setAttribute('value', document.getElementById('LTC-price').innerText);

    lockIn.appendChild(BTCPriceInput);
    lockIn.appendChild(ETHPriceInput);
    lockIn.appendChild(LTCPriceInput);

    lockIn.submit();
})
