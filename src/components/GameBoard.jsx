import React, { useEffect, useState } from 'react';
import {
  useToast, Flex, VStack, HStack,
} from '@chakra-ui/react';

import useEventListener from '../hooks/useEventListener';
import useWindowSize from '../hooks/useWindowSize';
import useLocalStorage from '../hooks/useLocalStorage';

import Keyboard from './Keyboard';
import Wordle from './Wordle';

import VALID_GUESSES from '../wordle/validguesses';
import TARGET_WORDS from '../wordle/targetwords';

// Some magic from stackoverflow - https://stackoverflow.com/a/23304189/6396652
// eslint-disable-next-line func-names
Math.seed = function (s) {
  // eslint-disable-next-line func-names
  return function () {
    // eslint-disable-next-line no-param-reassign
    s = Math.sin(s) * 10000; return s - Math.floor(s);
  };
};

export default function GameBoard() {
  const [currentGuessWord, setCurrentGuessWord] = useLocalStorage('currentGuessWord', '');
  const [targetWords, setTargetWords] = useState([]);
  const [guessedWords, setGuessedWords] = useLocalStorage('guessedWords', []);
  const [currentDate, setCurrentDate] = useLocalStorage('currentDate', '');

  const toast = useToast();
  const size = useWindowSize();

  let slices;

  if (size.width < 800) {
    slices = [[0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [10, 12], [12, 14], [14, 16]];
  } else if (size.width < 1550) {
    slices = [[0, 4], [4, 8], [8, 12], [12, 16]];
  } else {
    slices = [[0, 8], [8, 16]];
  }

  const tryAddLetterToCurrentGuessWord = (letter) => {
    if (currentGuessWord.length < 5) {
      setCurrentGuessWord(currentGuessWord + letter.toUpperCase());
    }
  };

  const tryBackspaceCurrentGuessWord = () => {
    if (currentGuessWord.length > 0) {
      setCurrentGuessWord(currentGuessWord.slice(0, -1));
    }
  };

  const trySubmitCurrentGuessWord = () => {
    if (currentGuessWord.length === 5 && VALID_GUESSES.includes(currentGuessWord)) {
      setGuessedWords([...guessedWords, currentGuessWord]);
      setCurrentGuessWord('');
    } else {
      toast({
        title: 'Invalid Guess',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const typeHandler = ({ key, keyCode }) => {
    if (keyCode === 8) {
      tryBackspaceCurrentGuessWord();
    } else if (keyCode === 13) {
      trySubmitCurrentGuessWord();
    } else if (keyCode >= 65 && keyCode <= 90) {
      tryAddLetterToCurrentGuessWord(key);
    }
  };

  useEventListener('keydown', typeHandler);

  useEffect(() => {
    const selected = [];

    // I'm pretty sure this will give everyone the same words each day
    const date = new Date().toJSON().slice(0, 10).replace(/-/g, '');
    const seededRandom = Math.seed(parseInt(date, 10));

    for (let i = 0; i < 16; i++) {
      selected.push(TARGET_WORDS[Math.floor(seededRandom() * TARGET_WORDS.length)]);
    }

    setTargetWords(selected);

    if (currentDate !== date) {
      setCurrentDate(date);
      setGuessedWords([]);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hStacks = [];
  for (const slice of slices) {
    // For some reason this must have a set height (even if it's 0) for the children to
    // match it's height. If we don't do this they (the wordle games) just push the
    // HStack height to be their max height so the full game is on screen for some reason
    hStacks.push(
      <HStack minHeight="15em" height="0" flexGrow={1} alignItems="stretch" spacing={3} key={slice}>
        {targetWords.slice(slice[0], slice[1]).map((targetWord, i) => (
          <Wordle
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            currentGuessWord={currentGuessWord}
            guessedWords={guessedWords}
            targetWord={targetWord}
          />
        ))}
      </HStack>,
    );
  }

  return (
    <Flex height="90vh" maxHeight="90vh" flexDirection="column" alignItems="center">
      <VStack spacing={4} flexGrow={1} flexDirection="column">
        {hStacks}
      </VStack>
      <Keyboard
        tryAddLetterToCurrentGuessWord={tryAddLetterToCurrentGuessWord}
        trySubmitCurrentGuessWord={trySubmitCurrentGuessWord}
        tryBackspaceCurrentGuessWord={tryBackspaceCurrentGuessWord}
      />
    </Flex>
  );
}
