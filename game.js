class Scene {
    constructor(id, image, description, choices, items) {
        this.id = id;
        this.image = image;
        this.description = description;
        this.choices = choices;
        this.items = items || []; // Items that can be collected in this scene
    }
}

class Game {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.inventory = [];
        this.maxInventorySize = 5;
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.selectedCharacter = null;
        this.initializeScenes();
        this.updateHealthDisplay();
        this.hideGameElements();
    }

    hideGameElements() {
        document.querySelector('.character-status').style.display = 'none';
        document.getElementById('inventory').style.display = 'none';
        // Remove or comment out this line:
        // document.getElementById('scene').style.display = 'none';
    }

    showGameElements() {
        document.querySelector('.character-status').style.display = 'flex';
        document.getElementById('inventory').style.display = 'block';
        document.getElementById('scene').style.display = 'block';
        document.getElementById('game-title').style.display = 'none';
    }

    initializeScenes() {
        // Character selection scene
        this.scenes.set('characterSelect', new Scene(
            'characterSelect',
            null,
            'You are a traveler exploring the lands of Japan, searching for knowledge and adventure. Along the way, you hear whispers of an ancient book that holds the secrets of Japan\'s past. But before you uncover its wisdom, you must understand the land itself',
            [
                {
                    text: 'Female Samurai',
                    description: 'A skilled warrior known for her swift blade and tactical mind.',
                    nextScene: 'start',
                    onSelect: () => this.selectCharacter('images/female_samurai_portrait.jpg')
                },
                {
                    text: 'Male Samurai',
                    description: 'A powerful warrior with unmatched strength and honor.',
                    nextScene: 'start',
                    onSelect: () => this.selectCharacter('images/male_samurai_portrait.jpg')
                }
            ]
        ));

        // Starting scene
        this.scenes.set('start', new Scene(
            'start',
            'images/japan_map.png',
            '<h1>Geography of Japan</h1>Japan is an island in East Asia, made up of thousands of islands. It is surrounded by the Pacific Ocean and the Sea of Japan.<br>Which of the following is the location of Hokkaido?',
            [
                {
                    text: 'Region 1',
                    isQuiz: true,
                    options: ['Region 1', 'Region 2', 'Region 3', 'Region 4'],
                    correct: 'Region 1',
                    damage: 15,
                    nextScene: 'northRegion'
                }
            ]
        ));

        // Update the North Region scene
        this.scenes.set('northRegion', new Scene(
            'northRegion',
            'images/mt_fuji.jpg',
            '<h1>The terrain and its impact</h1>Japan\'s terrain is mostly mountains, with only a small percentage of land suitable for farming. This has shaped Japanese society by making coastal and river valleys the main area for settlements.<br>How did Japan\'s mountainous terrain impact its people?',
            [
                {
                    text: 'Choose the correct impact',
                    isQuiz: true,
                    options: [
                        'It made farming difficult, so people lived in coastal areas and developed fishing & trade',
                        'It allowed Japan to easly grow large amounts of food everywhere',
                        'It had no impact on Japanese society'
                    ],
                    correct: 'It made farming difficult, so people lived in coastal areas and developed fishing & trade',
                    damage: 15,
                    nextScene: 'nextLocation'
                }
            ]
        ));

        // Update the ancient book scene with reset functionality
        this.scenes.set('nextLocation', new Scene(
            'nextLocation',
            'images/ancient_book.png',
            '<h1>Discovering the Ancient Book</h1>After traveling through the rugged terrain, you arrive at a forgotten temple deep in the forest. Inside, covered in dust, you find an ancient book. The book whispers of samurai, shoguns, and battles of the past. Will you open it and learn its secrets?',
            [
                {
                    text: 'Open the book',
                    onSelect: () => {
                        window.open('https://docs.google.com/presentation/d/1GXCXCIZ_mvS0GuxWLb2960mZiZLkpCbSByCxyNXBDfo/copy', '_blank');
                        this.addToInventory({
                            id: 'ancient_book',
                            name: 'Ancient Book',
                            image: 'images/ancient_book_inventory.png',
                            onClick: () => window.open('https://docs.google.com/presentation/d/1GXCXCIZ_mvS0GuxWLb2960mZiZLkpCbSByCxyNXBDfo/copy', '_blank')
                        });
                        return false;  // Prevents scene change
                    }
                },
                {
                    text: 'Continue',
                    nextScene: 'finalScene'
                },
                {
                    text: 'Back to Start',
                    onSelect: () => {
                        this.resetGame();  // This will reset health and clear inventory
                        return true;  // Allow scene change to happen
                    },
                    nextScene: 'characterSelect'
                }
            ]
        ));

        // Update the final scene with only location choices
        this.scenes.set('finalScene', new Scene(
            'finalScene',
            'images/feudal_japan.png',
            '<h1>Arriving in Feudal Japan</h1>You have been transported to the year 1185, during a time of samurai and shoguns.\n\nWhere will you choose to explore?\n\nVisit the Dojo, the marketplace, or venture into the Forest.',
            [
                {
                    text: 'Dojo',
                    nextScene: 'dojoScene'
                },
                {
                    text: 'Marketplace',
                    nextScene: 'marketScene'
                },
                {
                    text: 'Forest',
                    nextScene: 'forestScene'
                }
            ]
        ));

        // Add more scenes here
    }

    addToInventory(item) {
        // Check if item already exists in inventory
        const itemExists = this.inventory.some(existingItem => existingItem.id === item.id);
        if (itemExists) {
            return false;
        }

        if (this.inventory.length >= this.maxInventorySize) {
            alert('Inventory is full!');
            return false;
        }
        this.inventory.push(item);
        this.updateInventoryDisplay();
        return true;
    }

    removeFromInventory(itemId) {
        const index = this.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.inventory.splice(index, 1);
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }

    updateInventoryDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            slot.innerHTML = '';
            if (this.inventory[index]) {
                const item = this.inventory[index];
                slot.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-name">${item.name}</div>
                `;
                if (item.onClick) {
                    slot.style.cursor = 'pointer';
                    slot.addEventListener('click', item.onClick);
                }
            }
        });
    }

    selectCharacter(portraitPath) {
        this.selectedCharacter = portraitPath;
        document.getElementById('characterPortrait').src = portraitPath;
        this.showGameElements();
    }

    start() {
        this.showScene('characterSelect');
    }

    showScene(sceneId) {
        this.currentScene = this.scenes.get(sceneId);
        if (!this.currentScene) return;

        const sceneImage = document.getElementById('sceneImage');
        if (sceneId === 'characterSelect') {
            sceneImage.style.display = 'none';
        } else {
            sceneImage.style.display = 'block';
            sceneImage.src = this.currentScene.image || '';
        }

        document.getElementById('description').innerHTML = this.currentScene.description;

        const choicesDiv = document.getElementById('choices');
        choicesDiv.innerHTML = '';

        if (sceneId === 'characterSelect') {
            const container = document.createElement('div');
            container.className = 'character-select-container';

            this.currentScene.choices.forEach(choice => {
                const button = document.createElement('div');
                button.className = 'character-select-btn';
                button.innerHTML = `
                    <img src="${choice.onSelect.toString().match(/'([^']+)'/)[1]}" alt="Character Portrait">
                    <p>${choice.description}</p>
                `;
                button.addEventListener('click', () => {
                    if (choice.onSelect) {
                        choice.onSelect();
                    }
                    this.showScene(choice.nextScene);
                });
                container.appendChild(button);
            });

            choicesDiv.appendChild(container);
        } else {
            this.currentScene.choices.forEach(choice => {
                if (choice.isQuiz) {
                    this.createQuizButtons(choice, choicesDiv);
                } else {
                    this.createChoiceButton(choice, choicesDiv);
                }
            });
        }

        // Add item collection buttons if there are items in the scene
        if (this.currentScene.items && this.currentScene.items.length > 0) {
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'scene-items';

            this.currentScene.items.forEach(item => {
                const button = document.createElement('button');
                button.className = 'choice-btn item-btn';
                button.textContent = `Pick up ${item.name}`;
                button.addEventListener('click', () => {
                    if (this.addToInventory(item)) {
                        button.remove();
                        // Remove the item from the scene
                        this.currentScene.items = this.currentScene.items.filter(i => i.id !== item.id);
                    }
                });
                itemsDiv.appendChild(button);
            });

            document.getElementById('choices').appendChild(itemsDiv);
        }
    }

    createChoiceButton(choice, container) {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice.text;
        button.addEventListener('click', () => {
            if (choice.onSelect) {
                choice.onSelect();
            }
            this.showScene(choice.nextScene);
        });
        container.appendChild(button);
    }

    createQuizButtons(quiz, container) {
        quiz.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = option;
            button.addEventListener('click', () => {
                if (option === quiz.correct) {
                    alert('Correct!');
                    this.showScene(quiz.nextScene);
                } else {
                    alert('Wrong answer! Try again.');
                    // Apply damage if specified
                    if (quiz.damage) {
                        this.takeDamage(quiz.damage);
                    }
                }
            });
            container.appendChild(button);
        });
    }

    updateHealthDisplay() {
        const healthFill = document.getElementById('healthFill');
        const healthText = document.getElementById('healthText');
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;

        healthFill.style.width = `${healthPercentage}%`;
        healthText.textContent = `${this.currentHealth}/${this.maxHealth}`;

        // Update health bar color based on remaining health
        if (healthPercentage > 60) {
            healthFill.style.backgroundColor = '#00ff00';
        } else if (healthPercentage > 30) {
            healthFill.style.backgroundColor = '#ffff00';
        } else {
            healthFill.style.backgroundColor = '#ff4444';
        }
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthDisplay();

        if (this.currentHealth <= 0) {
            alert('Game Over! You ran out of health!');
            this.resetGame();
        }
    }

    resetGame() {
        this.currentHealth = this.maxHealth;
        this.inventory = [];
        this.updateHealthDisplay();
        this.updateInventoryDisplay();
        this.start();
    }
}

// Start the game when the page loads
window.onload = () => {
    const game = new Game();
    game.start();
};
