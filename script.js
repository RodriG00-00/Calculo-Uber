// Coordenadas da Uninassau Parangaba (Fortaleza/CE)
const UNINASSAU_LAT = -3.776606;
const UNINASSAU_LON = -38.563529;

// Tabelas de Preços Simulados (Taxa Base + Preço por Km)
const TARIFAS = {
    moto: { base: 2.50, km: 1.40 },
    uberX: { base: 4.50, km: 2.00 },
    comfort: { base: 5.50, km: 2.60 },
    black: { base: 7.50, km: 3.80 }
};

const inputCep = document.getElementById('cep');

// 1. MÁSCARA DO CEP (Adiciona o hífen automaticamente)
inputCep.addEventListener('input', function (e) {
    let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
    
    if (valor.length > 5) {
        valor = valor.replace(/^(\d{5})(\d)/, '$1-$2'); // Coloca o hífen após o 5º dígito
    }
    
    e.target.value = valor;
});

// 2. LÓGICA DE CÁLCULO
document.getElementById('calcularBtn').addEventListener('click', async () => {
    // Remove o hífen para enviar para a API ViaCEP
    const cepLimpo = inputCep.value.replace(/\D/g, '');
    
    const divResultado = document.getElementById('resultado');
    const divLoading = document.getElementById('loading');
    const divErro = document.getElementById('erro');

    // Resetar UI
    divResultado.classList.add('hidden');
    divErro.classList.add('hidden');
    
    if (cepLimpo.length !== 8) {
        mostrarErro('Por favor, digite um CEP válido (8 números).');
        return;
    }

    divLoading.classList.remove('hidden');

    try {
        // Buscar dados do CEP
        const resViaCep = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dadosCep = await resViaCep.json();

        if (dadosCep.erro) {
            throw new Error('CEP não encontrado. Verifique se o número está correto.');
        }

        const enderecoCompleto = `${dadosCep.logradouro}, ${dadosCep.bairro}, ${dadosCep.localidade} - ${dadosCep.uf}`;

        // Buscar coordenadas Geográficas do destino
        const query = encodeURIComponent(`${dadosCep.logradouro}, ${dadosCep.localidade}, Ceará, Brazil`);
        const resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const dadosGeo = await resGeo.json();

        if (dadosGeo.length === 0) {
            throw new Error('Endereço localizado, mas não foi possível encontrar as coordenadas no mapa.');
        }

        const destLat = parseFloat(dadosGeo[0].lat);
        const destLon = parseFloat(dadosGeo[0].lon);

        // Calcular distância da Uninassau Parangaba até o CEP
        const distanciaEmKm = calcularDistancia(UNINASSAU_LAT, UNINASSAU_LON, destLat, destLon);

        // Preencher as informações de texto
        document.getElementById('enderecoTexto').textContent = enderecoCompleto;
        document.getElementById('distanciaTexto').textContent = distanciaEmKm.toFixed(2).replace('.', ',');

        // Calcular e exibir os preços de cada categoria
        document.getElementById('precoMoto').textContent = formatarMoeda(TARIFAS.moto.base + (distanciaEmKm * TARIFAS.moto.km));
        document.getElementById('precoX').textContent = formatarMoeda(TARIFAS.uberX.base + (distanciaEmKm * TARIFAS.uberX.km));
        document.getElementById('precoComfort').textContent = formatarMoeda(TARIFAS.comfort.base + (distanciaEmKm * TARIFAS.comfort.km));
        document.getElementById('precoBlack').textContent = formatarMoeda(TARIFAS.black.base + (distanciaEmKm * TARIFAS.black.km));

        // Mostrar tela de resultados
        divLoading.classList.add('hidden');
        divResultado.classList.remove('hidden');

    } catch (error) {
        divLoading.classList.add('hidden');
        mostrarErro(error.message);
    }
});

// Função Auxiliar: Mostrar Erro
function mostrarErro(mensagem) {
    const divErro = document.getElementById('erro');
    divErro.textContent = mensagem;
    divErro.classList.remove('hidden');
}

// Função Auxiliar: Formatar para Real Brasileiro (R$)
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

// Algoritmo: Fórmula de Haversine (Distância em linha reta)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const raioTerraKm = 6371; 
    const dLat = grausParaRadianos(lat2 - lat1);
    const dLon = grausParaRadianos(lon2 - lon1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(grausParaRadianos(lat1)) * Math.cos(grausParaRadianos(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    
    // Adiciona um fator multiplicador (1.3x) para simular o trajeto real das ruas (em vez de apenas linha reta)
    const distanciaLinhaReta = raioTerraKm * c; 
    return distanciaLinhaReta * 1.3; 
}

function grausParaRadianos(graus) {
    return graus * (Math.PI/180);
}