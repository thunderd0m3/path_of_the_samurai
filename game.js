class Scene {
    constructor(id, image, description, choices, items, onLoad) {
        this.id = id;
        this.image = image;
        this.description = description;
        this.choices = choices;
        this.items = items || []; // Items that can be collected in this scene
        this.onLoad = onLoad;
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
        this.gameOverMessages = [
            'Samurai Spirit: <i>"The way of the Samurai is never without struggle. Stand firm, warrior. The spirits of your anscestors await to guide you back to the start."</i>',
            'Enigmatic Sage: <i>"The journey to mastery is never swift. Let the winds of the ancient spirits guide your steps as you begin again."</i>',
            'Guardian Spirit: <i>"Your journey has faltered, but the path remains. Rise with honor, for the spirits of the old warriors will watch over your next steps."</i>',
            'The Honorable Foe: <i>"Your skill is not yet perfected. Return to the beginning, where your honor can be sharpened like the blade of a katana."</i>'
        ];
        this.maxBossHealth = 50;
        this.currentBossHealth = 50;
        this.bossHitCount = 0;  // Track number of successful hits
        this.currentBattle = 1;  // Track which battle question we're on
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
                    nextScene: 'feudalJapanScene'
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

        // Update the feudal Japan scene to remove debug option
        this.scenes.set('feudalJapanScene', new Scene(
            'feudalJapanScene',
            'images/feudal_japan.png',
            '<h1>Arriving in Feudal Japan</h1>You have been transported to the year 1185, during a time of samurai and shoguns.<br><br>Where will you choose to explore?<br><br>Visit the Dojo, the marketplace, or venture into the Forest.',
            [
                {
                    text: 'Dojo',
                    nextScene: 'dojoScene',
                    isDisabled: () => this.inventory.some(item => item.id === 'katana')
                },
                {
                    text: 'Marketplace',
                    nextScene: 'marketScene',
                    isDisabled: () => this.inventory.some(item => item.id === 'armor')
                },
                {
                    text: 'Forest',
                    nextScene: 'forestScene',
                    isDisabled: () => this.inventory.some(item => item.id === 'helmet')
                }
            ],
            null,
            () => {
                // Check if all items are collected
                const hasAllItems = this.inventory.some(item => item.id === 'katana') &&
                                  this.inventory.some(item => item.id === 'armor') &&
                                  this.inventory.some(item => item.id === 'helmet');

                if (hasAllItems) {
                    this.showScene('prepareForBattle');
                }
            }
        ));

        // Update the first Dojo scene to point to the second one
        this.scenes.set('dojoScene', new Scene(
            'dojoScene',
            'images/dojo.jpg',
            '<h1>The Dojo (Samurai code of honor)</h1>A samurai master invites you to learn about the way of the warrior.<br><br>He has some questions for you to see if you are worthy of a true samurai.<br><br>Question: What is the Samurai code of honor called?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Feudalism',
                        'Bushido',
                        'Shinto'
                    ],
                    correct: 'Bushido',
                    damage: 15,
                    nextScene: 'dojoScene2'  // Changed from feudalJapanScene to dojoScene2
                }
            ]
        ));

        // Update the second Dojo scene to point to third scene
        this.scenes.set('dojoScene2', new Scene(
            'dojoScene2',
            'images/dojo.jpg',
            '<h1>The Dojo (Rise of the Shogunate)</h1>The emperor rewards Minamoto Yorimoto by making him shogun in 1192, beginning 700 years of shogunate rule.<br><br>Question: What was the role of the shogun?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Farmer leader',
                        'Emperor\'s servant',
                        'Military ruler of Japan'
                    ],
                    correct: 'Military ruler of Japan',
                    damage: 15,
                    nextScene: 'dojoScene3'  // Changed from feudalJapanScene to dojoScene3
                }
            ]
        ));

        // Update the third Dojo scene to add katana to inventory
        this.scenes.set('dojoScene3', new Scene(
            'dojoScene3',
            'images/samurai_receive_katana.jpg',
            '<h1>The Dojo (Katana)</h1>You have completed your training at the dojo and earned the trust of the samurai master. As a reward, you are gifted a katana, a symbol of your newfound skill and honor',
            [
                {
                    text: 'Accept the katana',
                    onSelect: () => {
                        this.addToInventory({
                            id: 'katana',
                            name: 'Katana',
                            image: 'images/katana.jpg'
                        });
                        return true;  // Allow scene change
                    },
                    nextScene: 'feudalJapanScene'
                }
            ]
        ));

        // Update the market scene with new quiz options
        this.scenes.set('marketScene', new Scene(
            'marketScene',
            'images/marketplace.png',
            '<h1>The Marketplace (Economic Growth)</h1>You enter the marketplace looking for items (and perhaps some knowledge) you may need to complete your journey. Merchants are trading silk, weapons, and rice. Japan\'s economy is growing, but who benefits the most?<br><br>Question: Who enjoyed most of Japan\'s wealth during the shogunate?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Farmers',
                        'Shoguns and noble families',
                        'Samurai'
                    ],
                    correct: 'Shoguns and noble families',
                    damage: 15,
                    nextScene: 'marketScene2'
                }
            ]
        ));

        // Update the second market scene with religion quiz options
        this.scenes.set('marketScene2', new Scene(
            'marketScene2',
            'images/marketplace.png',
            '<h1>The Marketplace (Religion & Culture)</h1>While browsing the market, you come across many shoppers with different religions and belief systems. Maybe you can find some important cultural knowledge here as well.<br><br>Question: Which religion focused on self-discipline and meditation?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Mahayana',
                        'Shinto',
                        'Zen Buddhism'
                    ],
                    correct: 'Zen Buddhism',
                    damage: 15,
                    nextScene: 'marketScene3'
                }
            ]
        ));

        // Update the third market scene to add armor to inventory
        this.scenes.set('marketScene3', new Scene(
            'marketScene3',
            'images/buying_armor.jpg',
            '<h1>The Marketplace (Armor)</h1>After talking and trading with the merchants in the bustling marketplace, you purchase strong armor that will protect you in battle. The armor symbolizes the importance of the warrior\'s defense in times of war.',
            [
                {
                    text: 'Purchase the armor',
                    onSelect: () => {
                        this.addToInventory({
                            id: 'armor',
                            name: 'Samurai Armor',
                            image: 'images/armor.jpg'
                        });
                        return true;  // Allow scene change
                    },
                    nextScene: 'feudalJapanScene'
                }
            ]
        ));

        // Update the game over scene to use random description
        this.scenes.set('gameOverScene', new Scene(
            'gameOverScene',
            () => this.selectedCharacter === 'images/female_samurai_portrait.jpg'
                ? 'images/female_samurai_lose.jpg'
                : 'images/male_samurai_lose.jpg',
            () => {
                const randomIndex = Math.floor(Math.random() * this.gameOverMessages.length);
                return `<h1>Game Over</h1>${this.gameOverMessages[randomIndex]}`;
            },
            [
                {
                    text: 'Try Again',
                    onSelect: () => {
                        this.resetGame();
                        return true;
                    },
                    nextScene: 'characterSelect'
                }
            ]
        ));

        // Update the first forest scene with storm quiz options
        this.scenes.set('forestScene', new Scene(
            'forestScene',
            'images/forest.png',  // Update to use the forest image
            '<h1>The Forest (Battle & Challenges)</h1>Nature is important to Japanese culture. You decide to wander the forest in an attempt to clear your mind and determine the best path forward. Night suddenly falls upon you and a mysterious bandit leaps from the brush. He challenges you to a duel. But it is not a duel of steel he wants. It is a duel of wits! You must defeat him!<br><br>In 1274 and 1281, Mongols invade, but typhoons destroy their fleets.<br>Question: What did the Japanese call these storms?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Tsunami',
                        'Kamikaze',
                        'Monsoon'
                    ],
                    correct: 'Kamikaze',
                    damage: 15,
                    nextScene: 'forestScene2'
                }
            ]
        ));

        // Rename and update comment for the existing scene
        // Update forest scene 2 with feudal system quiz options
        this.scenes.set('forestScene2', new Scene(
            'forestScene2',
            'images/forest.png',  // Update to use the forest image
            '<h1>The Forest (Battle & Challenges)</h1>As shogunate power weakens, daimyo rule like independent warlords.<br><br>Question: What system described loyalty between a samurai and a daimyo?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Guilds',
                        'Buddhism',
                        'Feudalism'
                    ],
                    correct: 'Feudalism',
                    damage: 15,
                    nextScene: 'forestScene3'
                }
            ]
        ));

        // Update the third forest scene with correct helmet image
        this.scenes.set('forestScene3', new Scene(
            'forestScene3',
            'images/finding_helmet.jpg',
            '<h1>The Forest (Battle & Challenges)</h1>Your duel with the bandit has proven your bravery and the bandit steps into the light and you see it is actually Tomoe, the famous female samurai, in disguise. She gives you her very own samurai helmet to help you on your journey.',
            [
                {
                    text: 'Accept the helmet',
                    onSelect: () => {
                        this.addToInventory({
                            id: 'helmet',
                            name: 'Samurai Helmet',
                            image: 'images/helmet.jpg'  // Update to use the new helmet image
                        });
                        return true;
                    },
                    nextScene: 'feudalJapanScene'
                }
            ]
        ));

        // Update the prepare for battle scene with new button text
        this.scenes.set('prepareForBattle', new Scene(
            'prepareForBattle',
            () => this.selectedCharacter === 'images/female_samurai_portrait.jpg'
                ? 'images/female_ready_for_battle.jpg'
                : 'images/male_ready_for_battle.jpg',
            '<h1>Prepare for Battle</h1><i>Steel meets morning light,<br>winds whisper of fate untold,<br>honor guides my hand.<br><br>Shadows fall behind,<br>the path ahead shines clearly,<br>no fear, only now.<br><br>Blade and spirit one,<br>the final stand approaches,<br>duty never fades.</i>',
            [
                {
                    text: 'Fight the final boss',
                    nextScene: 'finalBattle'
                }
            ]
        ));

        // Fix the boss attack scene with simple button
        this.scenes.set('bossAttackScene', new Scene(
            'bossAttackScene',
            'images/oni_miss.png',
            '<h1>Boss Battle</h1>The oni demon attacks!',
            [
                {
                    text: 'Continue fighting',
                    nextScene: () => {
                        switch(this.currentBattle) {
                            case 1: return 'finalBattle';
                            case 2: return 'finalBattle2';
                            case 3: return 'finalBattle3';
                            case 4: return 'finalBattle4';
                            case 5: return 'finalBattle5';
                            default: return 'finalBattle';
                        }
                    }
                }
            ]
        ));

        // Fix the player attack scene with proper progression
        this.scenes.set('playerAttackScene', new Scene(
            'playerAttackScene',
            'images/oni_hit.png',
            () => {
                if (this.bossHitCount === 0) {
                    return '<h1>Boss Battle</h1>You use your Katana to strike at the Oni\'s belly, knocking the wind out of him! You do 10 damage!';
                } else if (this.bossHitCount === 1) {
                    return '<h1>Boss Battle</h1>The Oni lunges at you with his club, but it is easily deflected by your helmet, giving you a chance to strike! You do 10 damage!';
                } else if (this.bossHitCount === 2) {
                    return '<h1>Boss Battle</h1>The Oni tries to kick you, but your strong armor absorbs it, and you manage to hit him in the knee! You do 10 damage!';
                } else if (this.bossHitCount === 3) {
                    return '<h1>Boss Battle</h1>You take advantage of the Oni\'s hurt knee and you strike with your Katana! You do 10 damage!';
                } else if (this.bossHitCount === 4) {
                    return '<h1>Boss Battle</h1>The furious Oni makes an attack, swinging his club and fist at you in enranged desperation. Your helmet deflects the club and your armor stops his fist. You use your Katana and land a final blow on his head for 10 damage!';
                }
                return '<h1>Boss Battle</h1>You strike at the Oni!';  // Default description
            },
            [
                {
                    text: () => this.bossHitCount === 4 ? 'Continue' : 'Attack again',
                    onSelect: () => {
                        this.bossHitCount++;
                        // Check if this was the final hit
                        if (this.currentBossHealth <= 0 && this.bossHitCount >= 5) {
                            this.showScene('victoryScene');
                            return false;
                        }
                        this.currentBattle++;  // Increment battle number
                        this.showScene(`finalBattle${this.currentBattle}`);  // Go directly to next battle
                        return false;  // Prevent default scene transition
                    }
                }
            ]
        ));

        // Update the first battle scene to set battle number
        this.scenes.set('finalBattle', new Scene(
            'finalBattle',
            'images/oni.png',
            '<h1>Boss Battle</h1>Question: What caused the Japanese emperor\'s power to weaken in the 800s?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'The emperor voluntarily gave up power',
                        'The samurai overthrew the emperor',
                        'Regents governed in place of the emperor',
                        'Japan was invaded by Mongols'
                    ],
                    correct: 'Regents governed in place of the emperor',
                    onCorrect: () => {
                        this.takeBossDamage(10);
                        this.updateBossHealthDisplay();
                        this.currentBattle = 1;  // Set current battle number
                        this.showScene('playerAttackScene');
                    },
                    onIncorrect: () => {
                        this.takeDamage(10);
                        this.showScene('bossAttackScene');
                    },
                    damage: 10
                }
            ],
            null,
            () => {
                this.currentBattle = 1;  // Also set battle number when scene loads
                this.createBossHealthUI(document.getElementById('description'));
            }
        ));

        // Add the victory scene
        this.scenes.set('victoryScene', new Scene(
            'victoryScene',
            'images/game_complete.png',
            '<h1>Victory!</h1><i>As the Oni falls, your journey through feudal Japan comes to an end. You have proven yourself a true samurai, mastering both knowledge and combat. The ancient spirits smile upon your victory, and your legend will be remembered for generations to come.</i>',
            [
                {
                    text: 'Play Again',
                    onSelect: () => {
                        this.resetGame();
                        return true;
                    },
                    nextScene: 'characterSelect'
                }
            ]
        ));

        // Update the second battle scene to set battle number
        this.scenes.set('finalBattle2', new Scene(
            'finalBattle2',
            'images/oni.png',
            '<h1>Boss Battle</h1>How did Minamoto Yoritomo become Japan\'s first Shogun?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'He defeated the Taira family and was appointed by the emperor',
                        'He inherited the title from his father',
                        'He overthrew the emperor and took the throne',
                        'He was elected by the people'
                    ],
                    correct: 'He defeated the Taira family and was appointed by the emperor',
                    onCorrect: () => {
                        this.takeBossDamage(10);
                        this.updateBossHealthDisplay();
                        this.currentBattle = 2;  // Set current battle number
                        this.showScene('playerAttackScene');
                    },
                    onIncorrect: () => {
                        this.takeDamage(10);
                        this.showScene('bossAttackScene');
                    },
                    damage: 10
                }
            ],
            null,
            () => {
                this.currentBattle = 2;  // Also set battle number when scene loads
                this.createBossHealthUI(document.getElementById('description'));
            }
        ));

        // Add the third final battle scene
        this.scenes.set('finalBattle3', new Scene(
            'finalBattle3',
            'images/oni.png',
            '<h1>Boss Battle</h1>What was a major reason for economic growth during the shogunate period?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Samurai controlled all businesses',
                        'Japan focused entirely on military conquest',
                        'Peasants became wealthy land owners',
                        'Improved irrigation led to increased agricultural production'
                    ],
                    correct: 'Improved irrigation led to increased agricultural production',
                    onCorrect: () => {
                        this.takeBossDamage(10);
                        this.updateBossHealthDisplay();
                        this.currentBattle = 3;  // Set current battle number
                        this.showScene('playerAttackScene');
                    },
                    onIncorrect: () => {
                        this.takeDamage(10);
                        this.showScene('bossAttackScene');
                    },
                    damage: 10
                }
            ],
            null,
            () => {
                this.currentBattle = 3;  // Also set battle number when scene loads
                this.createBossHealthUI(document.getElementById('description'));
            }
        ));

        // Add the fourth final battle scene
        this.scenes.set('finalBattle4', new Scene(
            'finalBattle4',
            'images/oni.png',
            '<h1>Boss Battle</h1>How did women\'s rights change as Japan became a warrior society?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'All women gained the right to own property',
                        'Women could become shogun if they were noble-born',
                        'Female samurai had equal status to mail samurai',
                        'Upper-class women lost freedoms, while peasant women had more autonomy'
                    ],
                    correct: 'Upper-class women lost freedoms, while peasant women had more autonomy',
                    onCorrect: () => {
                        this.takeBossDamage(10);
                        this.updateBossHealthDisplay();
                        this.currentBattle = 4;  // Set current battle number
                        this.showScene('playerAttackScene');
                    },
                    onIncorrect: () => {
                        this.takeDamage(10);
                        this.showScene('bossAttackScene');
                    },
                    damage: 10
                }
            ],
            null,
            () => {
                this.currentBattle = 4;  // Also set battle number when scene loads
                this.createBossHealthUI(document.getElementById('description'));
            }
        ));

        // Add the fifth final battle scene
        this.scenes.set('finalBattle5', new Scene(
            'finalBattle5',
            'images/oni.png',
            '<h1>Boss Battle</h1>Which of the following was a major cultural achievement in Feudal Japan?',
            [
                {
                    text: 'Choose your answer',
                    isQuiz: true,
                    options: [
                        'Kabuki theater was created for samurai entertainment',
                        'The Tale of Genji, the world\'s first novel, was written',
                        'Samurai wrote haiku poetry to record battle strategies',
                        'Japanese architects built stone castles modeled after Chinese palaces'
                    ],
                    correct: 'The Tale of Genji, the world\'s first novel, was written',
                    onCorrect: () => {
                        this.takeBossDamage(10);
                        this.updateBossHealthDisplay();
                        this.currentBattle = 5;  // Set current battle number
                        this.showScene('playerAttackScene');
                    },
                    onIncorrect: () => {
                        this.takeDamage(10);
                        this.showScene('bossAttackScene');
                    },
                    damage: 10
                }
            ],
            null,
            () => {
                this.currentBattle = 5;  // Also set battle number when scene loads
                this.createBossHealthUI(document.getElementById('description'));
            }
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
                    <img src="${item.image}" alt="${item.name}" title="${item.name}">
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

        // Hide health and inventory for character select and game over scenes
        if (sceneId === 'characterSelect' || sceneId === 'gameOverScene') {
            document.querySelector('.character-status').style.display = 'none';
            document.getElementById('inventory').style.display = 'none';
        } else {
            document.querySelector('.character-status').style.display = 'flex';
            document.getElementById('inventory').style.display = 'block';
        }

        const sceneImage = document.getElementById('sceneImage');
        if (sceneId === 'characterSelect') {
            sceneImage.style.display = 'none';
        } else {
            sceneImage.style.display = 'block';
            // Handle both function and string image paths
            const imagePath = typeof this.currentScene.image === 'function'
                ? this.currentScene.image()
                : this.currentScene.image;
            sceneImage.src = imagePath || '';
        }

        document.getElementById('description').innerHTML = typeof this.currentScene.description === 'function'
            ? this.currentScene.description()
            : this.currentScene.description;

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

        // Call onLoad function if it exists
        if (this.currentScene.onLoad) {
            this.currentScene.onLoad();
        }
    }

    createChoiceButton(choice, container) {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        // Handle both function and string text
        button.textContent = typeof choice.text === 'function'
            ? choice.text()
            : choice.text;

        // Check if button should be disabled
        if (choice.isDisabled && choice.isDisabled()) {
            button.disabled = true;
            button.classList.add('disabled');
        } else {
            button.addEventListener('click', () => {
                if (choice.onSelect) {
                    const shouldChangeScene = choice.onSelect();
                    if (shouldChangeScene !== false) {
                        // Handle both function and string nextScene values
                        const nextScene = typeof choice.nextScene === 'function'
                            ? choice.nextScene()
                            : choice.nextScene;
                        this.showScene(nextScene);
                    }
                } else {
                    // Handle both function and string nextScene values
                    const nextScene = typeof choice.nextScene === 'function'
                        ? choice.nextScene()
                        : choice.nextScene;
                    this.showScene(nextScene);
                }
            });
        }

        container.appendChild(button);
    }

    createQuizButtons(quiz, container) {
        quiz.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = option;
            button.addEventListener('click', () => {
                if (option === quiz.correct) {
                    if (quiz.onCorrect) {
                        quiz.onCorrect();
                    }
                    this.showScene(quiz.nextScene);
                } else {
                    if (quiz.onIncorrect) {
                        quiz.onIncorrect();
                    } else {
                        // Fallback to old behavior if no onIncorrect handler
                        alert('Wrong answer! Try again.');
                        if (quiz.damage) {
                            this.takeDamage(quiz.damage);
                        }
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
            this.showScene('gameOverScene');  // Show game over scene instead of alert
        }
    }

    resetGame() {
        this.currentHealth = this.maxHealth;
        this.inventory = [];
        this.updateHealthDisplay();
        this.updateInventoryDisplay();
        this.start();
    }

    takeBossDamage(amount) {
        this.currentBossHealth = Math.max(0, this.currentBossHealth - amount);
        this.updateBossHealthDisplay();
    }

    updateBossHealthDisplay() {
        const bossHealthBar = document.querySelector('.boss-health-bar');
        const bossHealthText = document.querySelector('.boss-health-text');
        const healthPercentage = (this.currentBossHealth / this.maxBossHealth) * 100;

        bossHealthBar.style.width = `${healthPercentage}%`;
        bossHealthText.textContent = `Boss HP: ${this.currentBossHealth}/${this.maxBossHealth}`;
    }

    createBossHealthUI(container) {
        const bossHealthContainer = document.createElement('div');
        bossHealthContainer.className = 'boss-health-container';

        const bossHealthBar = document.createElement('div');
        bossHealthBar.className = 'boss-health-bar';

        const bossHealthText = document.createElement('div');
        bossHealthText.className = 'boss-health-text';

        bossHealthContainer.appendChild(bossHealthBar);
        bossHealthContainer.appendChild(bossHealthText);
        container.insertBefore(bossHealthContainer, container.firstChild);

        this.updateBossHealthDisplay();
    }
}

// Start the game when the page loads
window.onload = () => {
    const game = new Game();
    game.start();
};
