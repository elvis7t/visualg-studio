const EMPTY_MESSAGE = 'Saída do programa aparecerá aqui...';

export function createConsoleView({ output }) {
  function showEmpty() {
    output.textContent = EMPTY_MESSAGE;
    output.classList.remove('error');
    output.classList.add('empty');
  }

  showEmpty();

  return {
    write(message, isError = false) {
      output.textContent = message;
      output.classList.toggle('error', isError);
      output.classList.remove('empty');
    },
    clear() {
      showEmpty();
    },
    getText() {
      return output.classList.contains('empty') ? '' : output.textContent;
    }
  };
}
