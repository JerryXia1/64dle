import React, { useCallback, useRef } from 'react';
import { VStack } from '@chakra-ui/react';

import Guess from './Guess';

const COLOUR_GREEN = '#538D4E';
const COLOUR_GREY = '#787C7E';
const COLOUR_YELLOW = '#C9B458';

// TODO: Clean this spaghetti up

function getColoursFromGuess(guess, target) {
  const guessLetters = guess.split('');
  const targetLetters = target.split('');
  const colours = ['', '', '', '', ''];

  // Calulcate greens and greys first
  guessLetters.forEach((guessLetter, i) => {
    if (guessLetter === targetLetters[i]) {
      colours[i] = COLOUR_GREEN;
    } else {
      colours[i] = COLOUR_GREY;
    }
  });

  // Now calculate yellows, I hope this is correct!
  guessLetters.forEach((guessLetter, i) => {
    if (colours[i] !== COLOUR_GREEN && targetLetters.includes(guessLetter)) {
      // The number of green or yellow of the same letter in our guess
      let guessOccurrences = 0;
      // The number of times the letter occurs in the target word
      let targetOccurrences = 0;

      for (let j = 0; j < guessLetters.length; j++) {
        if (
          guessLetters[j] === guessLetter
          && (colours[j] === COLOUR_GREEN || colours[j] === COLOUR_YELLOW)
        ) {
          guessOccurrences += 1;
        }
        if (targetLetters[j] === guessLetter) {
          targetOccurrences += 1;
        }
      }

      // If there are more of the letter in the target word than what we currently have
      // as green or yellow, it must at this point be marked as a yellow
      if (targetOccurrences - guessOccurrences > 0) {
        colours[i] = COLOUR_YELLOW;
      }
    }
  });

  return colours;
}

export default function Wordle({ currentGuessWord, guessedWords, targetWord }) {
  const wordleRef = useRef(null);

  const renderCurrentGuess = !guessedWords.includes(targetWord) && guessedWords.length < 84;
  const correctGuessIndex = guessedWords.indexOf(targetWord);

  // TODO: Priority:
  //   If we look at a completed wordle this wont scroll to the correctly guessed answer
  const currentGuessRef = useCallback((node) => {
    if (renderCurrentGuess && node !== null) {
      const rect = node.getBoundingClientRect();
      // This function only happens after a render so I think using parentNode is
      // eslint-disable-next-line no-param-reassign
      node.parentNode.scrollTop = (node.offsetTop - node.parentNode.offsetTop)
        - node.parentNode.getBoundingClientRect().height
        + rect.height;
      // +- explained:
      // scroll guess to top of div
      // scroll down the height of the wordle box
      // scroll up the height of the guess box
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGuessWord]);

  let currentGuess;
  if (renderCurrentGuess) {
    currentGuess = (
      <Guess
        isCurrentGuess
        refProp={currentGuessRef}
        letters={currentGuessWord.split('')}
        colours={[]}
      />
    );
  }

  return (
    <VStack
      height="100%"
      ref={wordleRef}
      overflowY="scroll"
      scrollBehavior="smooth"
      sx={{ scrollbarWidth: 'thin' }}
    >
      {guessedWords.map((g, i) => {
        if (correctGuessIndex !== -1 && i > correctGuessIndex) {
          return (
            <Guess
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              letters={[]}
              colours={[]}
            />
          );
        }
        const colours = getColoursFromGuess(g, targetWord);
        return (
          <Guess
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            letters={g.split('')}
            colours={colours}
          />
        );
      })}
      {/* Only display current guess if we haven't guessed correctly */}
      {renderCurrentGuess && currentGuess}
      { guessedWords.length < 84 && (
        [...Array((84 - guessedWords.length) - (renderCurrentGuess ? 1 : 0)).keys()].map((_, i) => (
          <Guess
          // eslint-disable-next-line react/no-array-index-key
            key={i}
            letters={[]}
            colours={[]}
          />
        ))
      )}
    </VStack>
  );
}
