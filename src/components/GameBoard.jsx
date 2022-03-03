import React, { useEffect, useState } from 'react';
import {
  HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Text, VStack, Flex, useDisclosure, useToast, Button,
} from '@chakra-ui/react';

import useEventListener from '../hooks/useEventListener';
import useWindowSize from '../hooks/useWindowSize';
import useLocalStorageOriginal from '../hooks/useLocalStorage';

import Keyboard from './Keyboard';
import Wordle from './Wordle';

import VALID_GUESSES from '../wordle/validguesses';
import TARGET_WORDS from '../wordle/targetwords';
import ShareButton from './ShareButton';

// TODO: Practice mode?

// Some magic from stackoverflow - https://stackoverflow.com/a/23304189/6396652
// eslint-disable-next-line func-names
Math.seed = function (s) {
  // eslint-disable-next-line func-names
  return function () {
    // eslint-disable-next-line no-param-reassign
    s = Math.sin(s) * 10000; return s - Math.floor(s);
  };
};

export default function GameBoard({ gameMode, correctGuessCount, setCorrectGuessCount }) {
  let useLocalStorage = useLocalStorageOriginal;
  if (gameMode === 'practice') {
    useLocalStorage = (_, arg) => useState(arg);
  }

  const [currentGuessWord, setCurrentGuessWord] = useLocalStorage('currentGuessWord', '');
  const [targetWords, setTargetWords] = useState([]);
  const [guessedWords, setGuessedWords] = useLocalStorage('guessedWords', []);
  const [currentDate, setCurrentDate] = useLocalStorage('currentDate', '');
  const [usedLetters, setUsedLetters] = useLocalStorage('usedLetters', []);
  const [hasWonGame, setHasWonGame] = useState(false);
  const [hasFinishedGame, setHasFinishedGame] = useState(false);

  const toast = useToast();
  const size = useWindowSize();

  // Success modal controls
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    if (
      currentGuessWord.length === 5
      && (TARGET_WORDS.includes(currentGuessWord) || VALID_GUESSES.includes(currentGuessWord))
    ) {
      // TODO: This will create duplicates
      setUsedLetters([...usedLetters, ...currentGuessWord.split('')]);
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
    // TODO: Double tapping enter submits the word twice (I think)
    // TODO: Pressing 2 letters quickly sometimes doesn't work
    if (keyCode === 8) {
      tryBackspaceCurrentGuessWord();
    } else if (keyCode === 13) {
      trySubmitCurrentGuessWord();
    } else if (keyCode >= 65 && keyCode <= 90) {
      tryAddLetterToCurrentGuessWord(key);
    }
  };

  useEventListener('keydown', typeHandler);

  // On first render calculate target words and erase any old game data
  useEffect(() => {
    const selected = [];

    // I'm pretty sure this will give everyone the same words each day
    const date = new Date().toJSON().slice(0, 10).replace(/-/g, '');
    const seededRandom = Math.seed(parseInt(date, 10));

    for (let i = 0; i < 64; i++) {
      selected.push(TARGET_WORDS[Math.floor(seededRandom() * TARGET_WORDS.length)]);
    }

    setTargetWords(selected);

    if (currentDate !== date) {
      setCurrentDate(date);
      setGuessedWords([]);
      setCurrentGuessWord('');
      setUsedLetters([]);
      setHasWonGame(false);
      setHasFinishedGame(false);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When new guesses come in, check if the game is over
  useEffect(() => {
    if (targetWords.length === 0) {
      // If we are inside this block, we are loading from the default state, which
      // could mean that we have 21 guesses from localStorage but 0 target words, which
      // is going to trigger the end of the game unless we stop here
      return;
    }

    let correct = 0;
    for (const word of targetWords) {
      if (guessedWords.includes(word)) {
        correct += 1;
      }
    }
    setCorrectGuessCount(correct);
    setHasWonGame(correct === 64);
    setHasFinishedGame(correct === 64 || guessedWords.length === 21);
  }, [guessedWords, targetWords, setCorrectGuessCount]);

  useEffect(() => {
    if (hasFinishedGame) {
      onOpen();
    }
  }, [hasFinishedGame, onOpen]);

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
    <>
      <Flex height="90vh" maxHeight="90vh" flexDirection="column" alignItems="center">
        <VStack spacing={4} flexGrow={1} flexDirection="column">
          {hStacks}
        </VStack>

        {/* DEBUG CONTROLS */}
        {window.location.hostname === 'localhost'
        && (
        <HStack sx={{ marginTop: '1em' }} padding="1em" backgroundColor="purple">
          <Button
            onClick={() => {
              setGuessedWords([...targetWords.slice(0, 15), 'TESTS', 'TESTS', 'TESTS', 'TESTS', 'TESTS']);
            }}
          >
            Fill 15/16 20/21
          </Button>
          <Button onClick={() => { localStorage.clear(); window.location.reload(); }}>
            Clear localStorage
          </Button>
        </HStack>
        )}

        <Keyboard
          usedLetters={usedLetters}
          tryAddLetterToCurrentGuessWord={tryAddLetterToCurrentGuessWord}
          trySubmitCurrentGuessWord={trySubmitCurrentGuessWord}
          tryBackspaceCurrentGuessWord={tryBackspaceCurrentGuessWord}
        />
      </Flex>

      {/* TODO: Make this a bit better. Statistics? */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>GG</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack sx={{ marginBottom: '2em' }}>
              {hasWonGame ? (
                <Text>Congratulations!</Text>
              ) : (
                <Text>Bad luck!</Text>
              )}
              <Text>
                You guessed
                {' '}
                {correctGuessCount}
                /64 words correctly
              </Text>
              {hasWonGame === false && (
                <Text>
                  The answers were:
                  {' '}
                  {targetWords.join(', ')}
                </Text>
              )}
              <ShareButton />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
