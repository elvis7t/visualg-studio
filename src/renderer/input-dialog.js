import { collectReadVariables } from '../interpreter/analysis.js';

export function createInputDialog({ stdin, inputDialog, inputFields, inputForm }) {
  return {
    createReader() {
      const queuedValues = getFallbackValues(stdin);
      const acceptedValues = [];

      return async (request) => {
        if (queuedValues.length > 0) {
          const value = queuedValues.shift();
          acceptedValues.push(value);
          return value;
        }

        const value = await requestValue(inputDialog, inputFields, inputForm, request);
        acceptedValues.push(value);
        stdin.value = acceptedValues.join('\n');
        return value;
      };
    },
    async requestValues(source) {
      const readVariables = collectReadVariables(source);
      if (readVariables.length === 0) return getFallbackValues(stdin);

      const fallbackValues = getFallbackValues(stdin);
      inputForm.reset();
      inputDialog.returnValue = '';
      inputFields.replaceChildren(...readVariables.map((name, index) => createInputField(name, fallbackValues[index], index)));

      inputDialog.showModal();
      inputFields.querySelector('input')?.focus();

      const result = await new Promise((resolve) => {
        inputDialog.addEventListener('close', () => resolve(inputDialog.returnValue), { once: true });
      });

      if (result !== 'confirm') return null;

      const values = [...new FormData(inputForm).values()].map(String);
      stdin.value = values.join('\n');
      return values;
    },
    clear() {
      stdin.value = '';
      inputForm.reset();
      inputFields.replaceChildren();
      inputDialog.returnValue = '';
    }
  };
}

async function requestValue(inputDialog, inputFields, inputForm, request) {
  inputForm.reset();
  inputDialog.returnValue = '';
  inputFields.replaceChildren(createInputField(request?.name ?? 'valor', '', 0));

  inputDialog.showModal();
  inputFields.querySelector('input')?.focus();

  const result = await new Promise((resolve) => {
    inputDialog.addEventListener('close', () => resolve(inputDialog.returnValue), { once: true });
  });

  if (result !== 'confirm') throw new Error('Entrada cancelada.');

  return String(new FormData(inputForm).values().next().value ?? '');
}

export function getFallbackValues(stdin) {
  return stdin.value ? stdin.value.split(/\s*\|\s*|\r?\n/).filter(Boolean) : [];
}

function createInputField(name, value, index) {
  const label = document.createElement('label');
  label.textContent = name;
  const input = document.createElement('input');
  input.name = `input-${index}`;
  input.value = value ?? '';
  input.autocomplete = 'off';
  label.append(input);
  return label;
}
