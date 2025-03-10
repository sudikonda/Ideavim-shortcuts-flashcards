import React, { useState, useEffect, useRef } from 'react';
import SidePanel from './components/SidePanel';
import CategorySelector from './components/CategorySelector';
import FlashcardDisplay from './components/FlashcardDisplay';
import ProgressControls from './components/ProgressControls';
import confetti from 'canvas-confetti';
import { Shuffle, RotateCcw, Check, X, BookOpen, Keyboard, Command } from 'lucide-react';
import { ideaVimCommands } from './ideaVimCommands';
import { leaderKeyCommands } from './leaderKeyCommands';
import { vimCommands } from './vimCommands';
import { vimiumCommands } from './vimiumCommands';

const allCommands = [...ideaVimCommands, ...leaderKeyCommands, ...vimCommands, ...vimiumCommands];

export interface Flashcard {
  id: number;
  parent: string;
  category: string;
  command: string;
  description: string;
}

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  const [showAnswer, setShowAnswer] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [practiceMode, setPracticeMode] = useState(true);
  const [selectedCommandSet, setSelectedCommandSet] = useState<'all' | 'ideavim' | 'leader' | 'vim' | 'vimium'>('all');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedPreference = localStorage.getItem('darkMode');
    return savedPreference ? JSON.parse(savedPreference) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    let commands: Flashcard[];
    switch (selectedCommandSet) {
      case 'all':
        commands = allCommands;
        break;
      case 'ideavim':
        commands = ideaVimCommands;
        break;
      case 'leader':
        commands = leaderKeyCommands;
        break;
      case 'vim':
        commands = vimCommands;
        break;
      case 'vimium':
        commands = vimiumCommands;
        break;
      default:
        commands = allCommands;
    }
    setFlashcards(commands);
    const uniqueCategories = Array.from(new Set(commands.map(card => card.category)));
    setCategories(uniqueCategories);
    setFilteredCards(commands);
    setCurrentCardIndex(0);
    setFlipped(false);
    setUserInput('');
    setIsCorrect(null);
  }, [selectedCommandSet]);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredCards(flashcards);
    } else {
      const filtered = flashcards.filter(card => card.category === selectedCategory);
      setFilteredCards(filtered);
    }
    setCurrentCardIndex(0);
    setFlipped(false);
    setUserInput('');
    setIsCorrect(null);
  }, [selectedCategory, flashcards]);

  useEffect(() => {
    if (practiceMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCardIndex, practiceMode]);

  const currentCard = filteredCards[currentCardIndex];

  const handleNext = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
      setUserInput('');
      setIsCorrect(null);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlipped(false);
      setUserInput('');
      setIsCorrect(null);
    }
  };

  const handleFlip = () => {
    if (!practiceMode) {
      setFlipped(!flipped);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setFilteredCards(shuffled);
    setCurrentCardIndex(0);
    setFlipped(false);
    setUserInput('');
    setIsCorrect(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleCommandSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCommandSet(e.target.value as 'ideavim' | 'leader' | 'vim' | 'vimium');
  };

  const handleKnown = () => {
    if (currentCard) {
      setKnownCards([...knownCards, currentCard.id]);
      handleNext();
    }
  };

  const handleUnknown = () => {
    if (currentCard) {
      setKnownCards(knownCards.filter(id => id !== currentCard.id));
      handleNext();
    }
  };

  const toggleShowAnswers = () => {
    setShowAnswer(!showAnswer);
  };

  const togglePracticeMode = () => {
    setPracticeMode(!practiceMode);
    setFlipped(false);
    setUserInput('');
    setIsCorrect(null);
  };

  const isCardKnown = (id: number) => knownCards.includes(id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const checkAnswer = () => {
    if (!currentCard) return;

    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedCommand = currentCard.command.toLowerCase();
    const processedInput = normalizedInput.replace(/space/g, ' ').replace(/leader/g, '<leader>');
    const processedCommand = normalizedCommand.replace(/<leader>/g, ' ');

    const correct =
      processedInput === processedCommand ||
      normalizedInput === normalizedCommand ||
      processedInput.replace(/ /g, '') === processedCommand.replace(/<leader>/g, '').replace(/ /g, '');

    setIsCorrect(correct);

    if (correct) {
      const button = document.querySelector('#check-button');
      if (button) {
        const rect = button.getBoundingClientRect();
        const duration = 100;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
      if (!isCardKnown(currentCard.id)) {
        setKnownCards([...knownCards, currentCard.id]);
      }
      setTimeout(handleNext, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  const getInputFeedbackClass = () => {
    if (isCorrect === null) return '';
    return isCorrect ? 'input-success' : 'input-error';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className={`transition-all ${isPanelOpen ? 'pr-80' : 'pr-0'}`}>
        <SidePanel 
          isOpen={isPanelOpen} 
          commands={allCommands} 
          selectedCommandSet={selectedCommandSet}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />
        <div className="flex flex-col items-center py-4 sm:py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4 sm:mb-12">
          <h1 className="text-xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-3 flex items-center justify-center">
            <Command className="w-5 h-5 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-primary" />
            Command Shortcuts Flashcards
          </h1>
          <p className="text-xs sm:text-lg text-gray-600 dark:text-gray-400">Master your keyboard shortcuts with these flashcards</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row justify-between items-center sm:gap-6 mb-6 sm:mb-8">
          <CategorySelector
            selectedCommandSet={selectedCommandSet}
            selectedCategory={selectedCategory}
            categories={categories}
            handleCommandSetChange={handleCommandSetChange}
            handleCategoryChange={handleCategoryChange}
          />

          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full">
            <button 
              onClick={handleShuffle} 
              className="btn btn-primary dark:text-gray-900 w-full"
              title="Shuffle flashcards"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" /> <span>Shuffle</span>
            </button>
            <button 
              onClick={toggleShowAnswers} 
              className="btn btn-secondary dark:text-gray-900 flex-1 sm:flex-none"
              title={`${showAnswer ? "Hide" : "Show"} answers`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">{showAnswer ? "Hide" : "Show"}</span>
            </button>
            <button 
              onClick={togglePracticeMode} 
              className="btn btn-neutral dark:text-gray-900 flex-1 sm:flex-none"
              title={`Switch to ${practiceMode ? "View" : "Practice"} mode`}
            >
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">{practiceMode ? "View" : "Practice"}</span>
            </button>
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="btn btn-neutral dark:text-gray-900 flex-1 sm:flex-none"
              title="Toggle Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h14V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-2H3V9z"></path>
                <path d="M15 5v2"></path>
                <path d="M15 11v2"></path>
                <path d="M15 17v2"></path>
              </svg>
            </button>
            <button onClick={toggleDarkMode} className="btn btn-neutral dark:text-gray-900 flex-1 sm:flex-none">
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {filteredCards.length > 0 && currentCard ? (
          <FlashcardDisplay
            currentCard={currentCard}
            flipped={flipped}
            practiceMode={practiceMode}
            showAnswer={showAnswer}
            isCardKnown={isCardKnown}
            userInput={userInput}
            isCorrect={isCorrect}
            selectedCommandSet={selectedCommandSet}
            handleFlip={handleFlip}
            handleInputChange={handleInputChange}
            checkAnswer={checkAnswer}
            handleKeyDown={handleKeyDown}
            getInputFeedbackClass={getInputFeedbackClass}
            inputRef={inputRef}
          />
        ) : (
          <div className="text-center text-gray-600 py-12">
            No flashcards available for this category.
          </div>
        )}

        <ProgressControls
          currentCardIndex={currentCardIndex}
          filteredCardsLength={filteredCards.length}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
        />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center w-full sm:w-auto">
          <button onClick={handleKnown} className="btn btn-success dark:text-gray-900">
            <Check className="w-4 h-4 sm:w-5 sm:h-5" /> <span>I know this</span>
          </button>
          <button onClick={handleUnknown} className="btn btn-danger dark:text-gray-900">
            <X className="w-4 h-4 sm:w-5 sm:h-5" /> <span>Still learning</span>
          </button>
          <button onClick={() => setKnownCards([])} className="btn btn-neutral dark:text-gray-900">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> <span>Reset progress</span>
          </button>
        </div>
      </div>

          <div className="text-center mt-4 sm:mt-12 text-xs text-gray-500">
        <p>Total commands: {flashcards.length} | Known: {knownCards.length}</p>
      </div>
      <footer className="footer text-xs py-1">sudikonda</footer>
        </div>
      </div>
    </div>
  );
}

export default App;
