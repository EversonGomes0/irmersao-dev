document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.querySelector('.card-container');
    const campoBusca = document.getElementById('campo-busca');
    const mainElement = document.querySelector('main');
    const botaoBusca = document.getElementById('botao-busca');
    const botaoWatchlist = document.getElementById('botao-watchlist');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');


    let allData = [];
    // Carrega a watchlist do localStorage ou inicia uma lista vazia
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    let mostrandoWatchlist = false;

    // Função para salvar a watchlist no localStorage
    const salvarWatchlist = () => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    };

    // Função para criar um card
    const criarCard = (item) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.id = item.nome; // Usando o nome como identificador único

        // Adiciona a imagem de fundo se ela existir no objeto
        if (item.imagem) {
            card.style.backgroundImage = `url('${item.imagem}')`;
        }

        const isWatchlisted = watchlist.includes(item.nome);

        card.innerHTML = `
            <h2>${item.nome} (${item.data_criacao})</h2>
            <p><strong>Diretor:</strong> ${item.diretor}</p>
            <p><strong>Duração/Episódios:</strong> ${item['duracao/episodios']}</p>
            <p>${item.descricao}</p>
            <div class="tags_container">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <a href="${item.link}" target="_blank">Avaliação</a> <br>
            <button class="watchlist-btn">${isWatchlisted ? 'Remover da Lista' : 'Adicionar à Lista'}</button>
        `;

        // Adiciona evento ao botão "Para Assistir"
        const watchlistBtn = card.querySelector('.watchlist-btn');
        if (isWatchlisted) {
            watchlistBtn.classList.add('added');
        }

        watchlistBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague para outros elementos
            toggleWatchlist(item.nome, watchlistBtn);
        });

        // Adiciona evento de clique no card para abrir o modal
        card.addEventListener('click', (e) => {
            // Abre o modal apenas se o clique não foi no botão ou no link
            if (e.target.tagName.toLowerCase() !== 'button' && e.target.tagName.toLowerCase() !== 'a') {
                abrirModal(item);
            }
        });
        return card;
    };

    // Função para adicionar ou remover da watchlist
    const toggleWatchlist = (itemName, button) => {
        const itemIndex = watchlist.indexOf(itemName);

        if (itemIndex > -1) {
            // Remove da watchlist
            watchlist.splice(itemIndex, 1);
            button.textContent = 'Adicionar à Lista';
            button.classList.remove('added');
        } else {
            // Adiciona na watchlist
            watchlist.push(itemName);
            button.textContent = 'Remover da Lista';
            button.classList.add('added');
        }

        salvarWatchlist(); // Salva o estado atualizado

        // Se estivermos na visualização da watchlist, remove o card da tela
        if (mostrandoWatchlist && itemIndex > -1) {
            document.querySelector(`.card[data-id="${itemName}"]`).remove();
        }
    };

    // Função para abrir e popular o modal
    const abrirModal = (item) => {
        modalContent.innerHTML = `
            <h2>${item.nome} (${item.data_criacao})</h2>
            <p><strong>Diretor:</strong> ${item.diretor}</p>
            <p><strong>Duração/Episódios:</strong> ${item['duracao/episodios']}</p>
            <p>${item.descricao}</p>
            <div class="tags_container">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="modal-actions">
                <a href="${item.link}" target="_blank">Ver Avaliações</a>
                <a href="${item.watch_link}" target="_blank" class="modal-watch-btn">Assistir</a>
            </div>
        `;
        modalOverlay.classList.add('visible');
    };

    // Função para fechar o modal
    const fecharModal = () => {
        modalOverlay.classList.remove('visible');
    };

    // Eventos para fechar o modal
    modalCloseBtn.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => {
        // Fecha somente se o clique for no overlay (fundo) e não no modal em si
        if (e.target === modalOverlay) {
            fecharModal();
        }
    });

    // Função para renderizar os cards na tela
    const renderizarCards = (dados) => {
        cardContainer.innerHTML = ''; // Limpa o container
        dados.forEach(item => {
            const cardElement = criarCard(item);
            cardContainer.appendChild(cardElement);
        });
    };

    // Função para filtrar e exibir a watchlist
    const exibirWatchlist = () => {
        if (watchlist.length === 0) {
            cardContainer.innerHTML = `
                <div class="empty-list-message">
                    <h2>Sua lista de interesse está vazia</h2>
                    <p>Adicione filmes ou séries para vê-los aqui!</p>
                </div>`;
        } else {
            const watchlistItems = allData.filter(item => watchlist.includes(item.nome));
            renderizarCards(watchlistItems);
        }
        botaoWatchlist.classList.add('active');
        mostrandoWatchlist = true;
    };

    // Função para buscar e renderizar
    const iniciarBusca = () => {
        mainElement.style.visibility = 'visible'; // Torna a lista visível
        const termoBusca = campoBusca.value.toLowerCase();
        const resultados = allData.filter(item =>
            item.nome.toLowerCase().includes(termoBusca) ||
            item.diretor.toLowerCase().includes(termoBusca) ||
            item.tags.some(tag => tag.toLowerCase().includes(termoBusca))
        );
        renderizarCards(resultados);
        botaoWatchlist.classList.remove('active');
        mostrandoWatchlist = false;
    };

    // Carrega os dados do JSON
    const carregarDados = async () => {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`Falha na requisição: ${response.status} ${response.statusText}`);
            allData = await response.json();
            // Renderiza os cards assim que os dados forem carregados
            renderizarCards(allData);
            // Torna a área principal visível (caso esteja oculta inicialmente)
            mainElement.style.visibility = 'visible';
        } catch (error) {
            console.error('Erro ao carregar os dados:', error);
            cardContainer.innerHTML = '<p>Não foi possível carregar os dados. Tente novamente mais tarde.</p>';
        }
    };

    // Event Listeners
    botaoBusca.addEventListener('click', iniciarBusca);
    campoBusca.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            iniciarBusca();
        }
    });
    document.addEventListener('keyup', (event) => {
        // Fecha o modal com a tecla 'Escape'
        if (event.key === 'Escape' && modalOverlay.classList.contains('visible')) {
            fecharModal();
        }
    });

    botaoWatchlist.addEventListener('click', () => {
        if (mostrandoWatchlist) {
            renderizarCards(allData); // Volta a exibir todos
            botaoWatchlist.classList.remove('active');
            mostrandoWatchlist = false;
        } else {
            exibirWatchlist();
        }
    });

    // Carga inicial dos dados
    carregarDados();
});