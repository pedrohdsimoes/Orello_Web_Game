window.onload = function () {

    orello.init('base');

    //Function to present a modal box with the rules
    document.getElementById("rules").addEventListener("click", function rulesButton() {
        // Get the modal
        var modal = document.getElementById("myModal");

        // When the user clicks the button, open the modal
        modal.style.display = "block";


        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    });

    //Function to present a modal box with the scores
    document.getElementById("scores").addEventListener("click", function scoresButton() {

        // Get the modal
        var modal = document.getElementById("myScores");

        modal.style.display = "block";


        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    });


};


var pcChecked;
var p2Checked;

let winW = 0;
let winB = 0;
let giveUp = false;
let endGame = false;
var cfBar = document.createElement('div'),
    cfBlack = document.createElement('span'),
    cfWhite = document.createElement('span');
//var url = "http://twserver.alunos.dcc.fc.up.pt:8008/",
var url = "http://twserver.alunos.dcc.fc.up.pt:8118/",
    //var url = "http://localhost:8118/"
    group = "18",
    gameId = "",
    turn = null,
    initGame = 0,
    inGame = 0;
var orello = {

    parent: null,
    score: null,
    rows: 8,
    cols: 8,
    grid: [],
    states: {
        'blank': { 'id': 0, 'color': 'white' },
        'white': { 'id': 1, 'color': 'white' },
        'black': { 'id': 2, 'color': 'black' }
    },
    turn: null,



    init: function (id) {

        this.parent = document.getElementById(id);
        document.getElementById("loadingCanvas").style.display = "none";


        this.parent.className = (this.parent.className ? this.parent.className + ' ' : '') + 'orello';

        // prepara e faz a grid
        this.prepareGrid();



        // this.prepareCf();
    },

    //tabuleiro com peças iniciais e dar a primeira jogada a peça preta
    initGame: function () {
        //PC
        // a peça preta inicia o jogo
        if (pcChecked = 1) {
            this.setTurn(this.states.black);

            // posicionamento das peças iniciais
            this.setItemState(4, 4, this.states.white);
            this.setItemState(4, 5, this.states.black);
            this.setItemState(5, 4, this.states.black);
            this.setItemState(5, 5, this.states.white);
            //PC
            // Contador inicial
            this.setScore(2, 2, 60);
        }


    },

    //Troca de jogador
    changePlayer: function () {
        if (p2Checked == 1) {
            orello.notifySkip();
            var skipButton = document.getElementById("skipServer");

            skipButton.disabled = true;
        }
        else {
            var turn = (this.turn.id === this.states.black.id) ? this.states.white : this.states.black;

            this.setTurn(turn);
        }
    },

    //muda _ de acordo com quem joga (Saber quem joga)
    setTurn: function (state) {
        if (p2Checked == 1) return;
        this.turn = state;

        var isBlack = (state.id === this.states.black.id);

        this.score.black.elem.style.textDecoration = isBlack ? 'underline' : '';
        this.score.white.elem.style.textDecoration = isBlack ? '' : 'underline';

    },

    //meter estado inicial das peças em blank 
    initItemState: function (elem) {

        return {
            'state': this.states.blank,
            'elem': elem
        };
    },

    // é visivel por ter peça branca ou preta 
    isVisible: function (state) {

        return (state.id === this.states.white.id || state.id === this.states.black.id);
    },

    // dado as coordenadas de uma posição, verifica se é visivel (peça branca ou preta)
    isVisibleItem: function (row, col) {

        return this.isVisible(this.grid[row][col].state);
    },

    // verifica se as coordenadas de uma posição são validas
    isValidPosition: function (row, col) {

        return (row >= 1 && row <= this.rows) && (col >= 1 && col <= this.cols);
    },

    // Muda o estado das peças de acordo com as coordenadas dadas
    setItemState: function (row, col, state) {
        //se coordenadas não forem validas, então não faz nada
        if (!this.isValidPosition(row, col)) return;

        //se forem validas, o estado da posição das coordenadas dadas passa a ser o estado da posição dada 
        this.grid[row][col].state = state;
        //se tiver peça, elem é visivel, senão invisivel
        this.grid[row][col].elem.style.visibility = this.isVisible(state) ? 'visible' : 'hidden';
        // guarda a cor da peça dada
        this.grid[row][col].elem.style.backgroundColor = state.color;
    },

    // Prepara o tabuleiro
    prepareGrid: function () {

        // Criaçao do tabuleiro
        var table = document.createElement('table');

        // formatação das cells do tabuleiro
        table.setAttribute('border', 0);
        table.setAttribute('cellpadding', 0);
        table.setAttribute('cellspacing', 0);

        for (var i = 1; i <= this.rows; i++) {

            var tr = document.createElement('tr');
            //linhas da tabela
            table.appendChild(tr);

            this.grid[i] = [];

            for (var j = 1; j <= this.cols; j++) {

                var td = document.createElement('td');
                td.className = "ClickCell";
                // celulas da tabela
                tr.appendChild(td);

                // quando se carrega numa celula , verificar se peça pode mover ou não. 
                // verifica tambem se ha mais jogadas possiveis ou o tabuleiro esta cheio para acabar o jogo
                this.bindMove(td, i, j);

                // meter peças todas no estado: blank
                // td.appendChild(document.createElement('span')) => peça
                this.grid[i][j] = this.initItemState(td.appendChild(document.createElement('span')));
            }
        }

        // Estado das peças
        var scoreBar = document.createElement('div'),
            scoreBlack = document.createElement('span'),
            scoreWhite = document.createElement('span'),
            scoreEmpty = document.createElement('span');

        scoreWhite.className = 'score-node score-white';
        scoreBlack.className = 'score-node score-black';
        scoreEmpty.className = 'score-node score-empty';



        scoreBar.appendChild(scoreWhite);
        scoreBar.appendChild(scoreBlack);
        scoreBar.appendChild(scoreEmpty);


        this.parent.appendChild(scoreBar);


        this.score = {
            'black': {
                'elem': scoreBlack,
                'state': 0
            },
            'white': {
                'elem': scoreWhite,
                'state': 0
            },
            'empty': {
                'elem': scoreEmpty,
                'state': 0
            },
        }


        this.parent.appendChild(table);
    },

    // Prepara a classificação
    prepareCf: function () {

        cfWhite.className = 'cf-node cf-white';
        cfBlack.className = 'cf-node cf-black';

        cfBar.appendChild(cfWhite);
        cfBar.appendChild(cfBlack);

        this.parent.appendChild(cfBar);

        cfBlack.innerHTML = '&nbsp;' + winB + '&nbsp;';
        cfWhite.innerHTML = '&nbsp;' + winW + '&nbsp;';
    },

    // recalcula o score de cada peça e das peças livres de acordo com as peças jogadas
    recalcuteScore: function () {

        var scoreWhite = 0,
            scoreBlack = 0,
            scoreEmpty = 64;

        for (var i = 1; i <= this.rows; i++) {

            for (var j = 1; j <= this.cols; j++) {

                if (this.isValidPosition(i, j) && this.isVisibleItem(i, j)) {

                    if (this.grid[i][j].state.id === this.states.black.id) {

                        scoreBlack++;
                        scoreEmpty--;
                    } else {

                        scoreWhite++;
                        scoreEmpty--;
                    }
                }
            }
        }

        this.setScore(scoreBlack, scoreWhite, scoreEmpty);
    },

    // Atualiza o score de cada peça e espaços livres
    setScore: function (scoreBlack, scoreWhite, scoreEmpty) {

        this.score.black.state = scoreBlack;
        this.score.white.state = scoreWhite;
        this.score.empty.state = scoreEmpty;

        this.score.black.elem.innerHTML = '&nbsp;' + scoreBlack + '&nbsp;';
        this.score.white.elem.innerHTML = '&nbsp;' + scoreWhite + '&nbsp;';
        this.score.empty.elem.innerHTML = '&nbsp;' + scoreEmpty + '&nbsp;';
    },

    // Diz se a jogada feita é valida
    isValidMove: function (row, col) {

        var current = this.turn,
            rowCheck,
            colCheck,
            toCheck = (current.id === this.states.black.id) ? this.states.white : this.states.black;

        if (!this.isValidPosition(row, col) || this.isVisibleItem(row, col)) {

            return false;
        }

        // verficar 8 posições a volta da peça
        for (var rowDir = -1; rowDir <= 1; rowDir++) {

            for (var colDir = -1; colDir <= 1; colDir++) {

                // não precisa de verificar a posição da propria peça
                if (rowDir === 0 && colDir === 0) {

                    continue;
                }

                // seguir para a proxima peça
                rowCheck = row + rowDir;
                colCheck = col + colDir;

                //peças encontradas?
                var itemFound = false;

                // procura por posiçoes validas
                // procura por peças visiveis
                // procura por peças da cor oposta
                while (this.isValidPosition(rowCheck, colCheck) && this.isVisibleItem(rowCheck, colCheck) && this.grid[rowCheck][colCheck].state.id === toCheck.id) {

                    // mover para a proxima posição
                    rowCheck += rowDir;
                    colCheck += colDir;

                    // peça encontrada
                    itemFound = true;
                }

                // se peça foi encontrada
                if (itemFound) {

                    // verificar que a proxima peça é nossa
                    if (this.isValidPosition(rowCheck, colCheck) && this.isVisibleItem(rowCheck, colCheck) && this.grid[rowCheck][colCheck].state.id === current.id) {

                        // jogada valida
                        return true;
                    }

                }
            }
        }

        return false;
    },

    // percorre o tabuleiro e diz se a peça pode ser posta numa posição
    canMove: function () {

        for (var i = 1; i <= this.rows; i++) {

            for (var j = 1; j <= this.cols; j++) {

                if (this.isValidMove(i, j)) {

                    return true;
                }
            }
        }

        return false;
    },

    bindMove: function (elem, row, col) {

        var self = this;

        elem.onclick = function (event) {
            if (p2Checked == 1)
                orello.notify(row, col);

            if (self.canMove()) {

                // se temos jogada valida
                if (self.isValidMove(row, col)) {
                    //PC
                    // fazer jogada
                    if (pcChecked = 1) self.move(row, col);

                    // se o outro jogador puder fazer jogada, faz. Senão muda a vez para o outro jogador.
                    if (!self.canMove()) {
                        //PC
                        if (pcChecked = 1) self.changePlayer();

                        // verificar se o jogo chegou ao fim
                        if (!self.canMove()) {

                            self.endGame();
                        }
                    }

                    // se o tabuleiro ficar cheio, fim do jogo
                    if (self.checkEnd()) {

                        self.endGame();
                    }
                } else alert('Jogada Invalida!');
            }
        };
    },

    endGame: function () {
        endGame = true;
        var result = (this.score.black.state > this.score.white.state)
            ?
            1
            : (
                (this.score.white.state > this.score.black.state) ? -1 : 0
            );


        (result == 1)
            ?
            winB++
            : (
                (result == -1) ? winW++ : 0
            );


        switch (result) {

            case 1: { message = 'A bolacha ganhou!'; } break;
            case -1: { message = 'O Recheio ganhou!'; } break;
            case 0: { message = 'Empataram'; } break;
        }

        alert(message);




    },
    //limpar tabuleiro
    clear: function () {

        for (var i = 1; i <= this.rows; i++) {

            for (var j = 1; j <= this.cols; j++) {

                this.setItemState(i, j, this.states.blank);
            }
        }
    },
    gameMode: function () {
        var pc = document.getElementById('pc');
        if (pc.checked) { pcChecked = 1; p2Checked = 0; }
        else { p2Checked = 1; pcChecked = 0; }

        console.log("pc " + pcChecked);
        console.log("p2 " + p2Checked);
    },

    start: function () {

        if (pcChecked == 1) this.initGame();
        inGame = 1;
        // limpa tabuleiro
        if (p2Checked == 1) this.clear();


        //aparece a animação de carregar enquanto não estão 2 jogadores ligados
        // if (p2Checked == 1) this.loading();
        //juntar no servidor para jogar contra alguem e esperar por p2
        if (p2Checked == 1) this.join();

        this.updateCf();
    },

    giveUp: function () {

        // limpa tabuleiro
        this.clear();
        this.leave();
        giveUp = true;
        //ve quem desistiu
        var turn = (this.turn.id === this.states.black.id) ? alert('A Bolacha desistiu :(\nO Recheio ganhou! :)') : alert('O Recheio desistiu :(\nA Bolacha ganhou! :)');
        (this.turn.id === this.states.black.id) ? winW++ : winB++;


    },

    checkEnd: function () {

        for (var i = 1; i <= this.rows; i++) {

            for (var j = 1; j <= this.cols; j++) {

                if (this.isValidPosition(i, j) && !this.isVisibleItem(i, j)) {

                    return false;
                }
            }
        }

        return true;
    },


    move: function (row, col) {

        var finalItems = [],
            current = this.turn,
            rowCheck,
            colCheck,
            toCheck = (current.id === this.states.black.id) ? this.states.white : this.states.black;

        if (row == -1 && col == -1) return;
        // verificar 8 posiçoes a volta da peça
        for (var rowDir = -1; rowDir <= 1; rowDir++) {

            for (var colDir = -1; colDir <= 1; colDir++) {

                // nao precisa de verificar a propria peça
                if (rowDir === 0 && colDir === 0) {

                    continue;
                }

                // mover para a proxima peça
                rowCheck = row + rowDir;
                colCheck = col + colDir;

                // array de peças possiveis
                var possibleItems = [];

                // procura posiçoes validas
                // procura posiçoes visiveis
                // procura peças de outra cor
                while (this.isValidPosition(rowCheck, colCheck) && this.isVisibleItem(rowCheck, colCheck) && this.grid[rowCheck][colCheck].state.id === toCheck.id) {
                    // O método push() adiciona um ou mais elementos ao final de um array e retorna o novo comprimento desse array
                    possibleItems.push([rowCheck, colCheck]);

                    // seguir para proxima posição
                    rowCheck += rowDir;
                    colCheck += colDir;
                }

                // se peça foi encontrada
                if (possibleItems.length) {

                    // verificar se a peça é nossa
                    if (this.isValidPosition(rowCheck, colCheck) && this.isVisibleItem(rowCheck, colCheck) && this.grid[rowCheck][colCheck].state.id === current.id) {

                        // meter a peça
                        finalItems.push([row, col]);

                        // faz push da linha de cada peça
                        for (var item in possibleItems) {

                            finalItems.push(possibleItems[item]);
                        }
                    }
                }
            }
        }

        // verifica que peças tem que trocar
        if (finalItems.length) {

            for (var item in finalItems) {

                this.setItemState(finalItems[item][0], finalItems[item][1], current);
            }
        }

        // passa a vez ao outro jogador
        this.setTurn(toCheck);

        // atualiza o score 
        this.recalcuteScore();
    },

    updateCf: function () {
        if (giveUp || endGame) {
            cfBlack.innerHTML = '&nbsp;' + winB + '&nbsp;';
            cfWhite.innerHTML = '&nbsp;' + winW + '&nbsp;';
        }
    },

    //--------------------- PEDIDOS AO SERVIDOR ---------------------------//
    join: function () {
        game = {
            group: group,
            nick: nick,
            pass: pass
        }

        fetch(url + "join", {
            method: "POST",
            body: JSON.stringify(game),
        })
            .then(function (r) {
                return r.json();
            })
            .then(function (t) {
                gameId = t.game;
                orello.update();
            })


    },

    leave: function () {
        game = {
            game: gameId,
            nick: nick,
            pass: pass
        }

        fetch(url + "leave", {
            method: "POST",
            body: JSON.stringify(game),
        })
            .then(function (r) {
                return r.text();
            })
            .then(function (t) {
                inGame = 0;
                return t;
            })
            .catch(function (error) {
                console.log(error);
                return;
            });
    },
    notify: function (row, col) {
        x = ({
            "nick": nick,
            "pass": pass,
            "game": gameId,
            "move": {
                "row": row - 1,
                "column": col - 1
            }
        });

        fetch(url + "notify", {
            method: "POST",
            body: JSON.stringify(x)
        })
            .then(function (r) {

                return r.text();
            })
            .then(function (t) {
                return t;
            });

    },
    notifySkip: function (row, col) {
        x = ({
            "nick": nick,
            "pass": pass,
            "game": gameId,
            "move": null
        });

        fetch(url + "notify", {
            method: "POST",
            body: JSON.stringify(x)
        })
            .then(function (r) {

                return r.text();
            })
            .then(function (t) {
                return t;
            });

    },

    //da as classificações de todos os jogos feitos de diferentes users
    ranking: function () {
        fetch(url + "ranking", {
            method: "POST",
            body: JSON.stringify(""),
        })
            .then(function (r) {
                return r.json();
            })
            .then(function (t) {
                if (t.ranking != undefined) {
                    //console.log(response.ranking.length);
                    var json = t.ranking;
                    var test =
                        "<table id=test_ class='cf'>" +
                        "<tr class='cf'>" +
                        "<th class='cf'>Jogador</th>" +
                        "<th class='cf'>Número de Jogos</th>" +
                        "<th class='cf'>Número de Vitórias</th>" +
                        "<th class='cf'>Número de Derrotas</th>" +
                        "<th class='cf'>Percentagem de Vitórias</th>" +
                        "</tr>";


                    for (var j = 0; j < json.length; j++) {

                        test +=
                            "<tr class='cf'>" +
                            "<td class='cf'>" + json[j].nick + "</td>" +
                            "<td class='cf'>" + json[j].games + "</td>" +
                            "<td class='cf'>" + json[j].victories + "</td>" +
                            "<td class='cf'>" + (json[j].games - json[j].victories) + "</td>" +
                            "<td class='cf'>" + ((json[j].victories / json[j].games) * 100).toFixed(1) + "%" + "</td>";
                        test += "</tr>";
                    }

                    test +=
                        "</table>" +
                        "</div>";

                    document.getElementById("table_on").innerHTML = test;
                } else {
                    document.getElementById("table_on").innerHTML = "Classificações indisponíveis ou vazias";
                }
            })
    },
    //regista e faz login 
    register: function () {
        nick = document.getElementById("nick").value;
        pass = document.getElementById("pass").value;
        x = {
            "nick": nick,
            "pass": pass
        };

        fetch(url + "register", {
            method: "POST",
            body: JSON.stringify(x),
        })
            .then(function (r) {
                return r.text();
            })
            .then(function (t) {
                if (t !== "{}") window.alert(JSON.parse(t).error);
                else {
                    document.getElementById("userLogin").innerHTML = "Welcome, " + nick;
                }
            })
            .catch(function (error) {
                console.log(error);
                return;
            });

    },

    update: function () {
        eventSource = new EventSource(url + "update?nick=" + nick + "&game=" + gameId);



        eventSource.onmessage = function (event) {

            if (inGame == 1) orello.initGame();
            inGame = 0;

            var c = document.getElementById('loadingCanvas');
            c.style.visibility = "hidden";

            var data = JSON.parse(event.data);
            //atualiza score para 2 jogadores
            orello.setScore(data.count.dark, data.count.light, data.count.empty);

            //mete peças para os 2 jogadores
            if ("board" in data) {

                let r = 1;
                for (let row of data.board) {
                    let c = 1;
                    for (let color of row) {
                        const peca = (color == "empty" ? orello.states.blank : (color == "dark" ? orello.states.black : orello.states.white))
                        orello.setItemState(r, c, peca);
                        c++;
                    }
                    r++;
                }

            }

            if (data.move == undefined) {


                if (data.turn == nick) {
                    var pai = document.getElementById("showturn");
                    pai.style.visibility = "visible";
                    pai.innerHTML = "Jogada: " + data.turn;
                    nick.color = "dark";
                    game.turn = 0;


                } else {
                    nick.color = "light";
                    game.turn = 1;

                    var pai = document.getElementById("showturn");
                    pai.style.visibility = "visible";
                    pai.innerHTML = "Jogada: " + data.turn;
                }

            }


            if (data.skip == true) {
                alert('Não existem jogadas possiveis. Passe a vez!');
                var skipButton = document.getElementById("skipServer");
                skipButton.disabled = false;

            }


            if (data.move != undefined) {
                if (data.turn == nick) {


                } else if (data.turn != nick) {

                    console.log(data.turn);

                }
                if (data.winner != undefined) {
                    inGame = 0;
                    eventSource.close();

                    if (data.winner != null) {
                        alert(data.winner + " ganhou!");
                        pai.style.visibility = "hidden";
                        console.log(data.winner);
                    } else {
                        alert(data.winner + " ganhou!");
                        pai.style.visibility = "hidden";
                        console.log(data.winner);
                    }
                }
            }
            if (data.winner != undefined) {
                inGame = 0;
                eventSource.close();
                alert(data.winner + " ganhou!");
                pai.style.visibility = "hidden";
                console.log(data.winner);
            }
            if (data.winner === null) {
                inGame = 0;
                eventSource.close();

            }
        }
    },

    //Canvas loading animation
    loading: function () {
        var c = document.getElementById('loadingCanvas'),

            ctx = c.getContext('2d'),
            pi = Math.PI,
            xCenter = c.width / 2,
            yCenter = c.height / 2,
            radius = c.width / 3,
            startSize = radius / 3,
            num = 5,
            posX = [],
            posY = [],
            angle, i;


        loadingCanvas.style = "position:fixed; left: 50%; width: 400px; margin-left: -200px;";
        window.setInterval(function () {
            num++;
            ctx.clearRect(0, 0, xCenter * 2, yCenter * 2);
            for (i = 0; i < 9; i++) {
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,' + .1 * i + ')';
                if (posX.length == i) {
                    angle = pi * i * .25;
                    posX[i] = xCenter + radius * Math.cos(angle);
                    posY[i] = yCenter + radius * Math.sin(angle);
                }
                ctx.arc(
                    posX[(i + num) % 8],
                    posY[(i + num) % 8],
                    startSize / 9 * i,
                    0, pi * 2, 1);
                ctx.fill();
            }
        }, 100);
    }
};





