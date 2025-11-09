function calc_cart(qtdCamisa, qtdCalca, qtdBermuda) {
    const precoCamisa = 30;
    const precoCalca = 70;
    const precoBermuda = 50;
    
    let total = (qtdCamisa * precoCamisa) + (qtdCalca * precoCalca) + (qtdBermuda * precoBermuda);
    
    if (total > 100) {
        total = total * 0.9; 
    }
    
    return total;
}

module.exports = calc_cart;
