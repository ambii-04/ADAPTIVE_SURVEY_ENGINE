// Hot chocolate ingredient options. Change the options here, not in the UI.
// The quest is local to the browser: choices are saved on this device and are not sent to the research backend.

export const CHAMBERS = [
  {
    id: 'base',
    title: 'Base',
    prompt: 'Which chocolate forms the base of your cup?',
    options: [
      { id: 'milk', label: 'Milk chocolate', color: '#8a5a3a' },
      { id: 'dark', label: 'Dark chocolate', color: '#3b1f14' },
      { id: 'white', label: 'White chocolate', color: '#ead9bf' },
      { id: 'creamy', label: 'Creamy cocoa', color: '#6b4330' },
    ],
  },
  {
    id: 'flavour',
    title: 'Flavour',
    prompt: 'Which flavour should the cup carry?',
    options: [
      { id: 'classic', label: 'Classic chocolate', tint: null, accent: '#5a3520' },
      { id: 'caramel', label: 'Caramel', tint: '#c98a3a', accent: '#c98a3a' },
      { id: 'hazelnut', label: 'Hazelnut', tint: '#8b5a2b', accent: '#9a6a3a' },
      { id: 'strawberry', label: 'Strawberry', tint: '#c2465a', accent: '#c2465a' },
      { id: 'vanilla', label: 'Vanilla', tint: '#e8d5a0', accent: '#e8d5a0' },
      { id: 'mocha', label: 'Mocha', tint: '#4a2a1c', accent: '#6b4a32' },
    ],
  },
  {
    id: 'sweetness',
    title: 'Sweetness',
    prompt: 'How sweet should it be?',
    options: [
      { id: 'light', label: 'Light' },
      { id: 'balanced', label: 'Balanced' },
      { id: 'extra', label: 'Extra sweet' },
    ],
  },
  {
    id: 'toppings',
    title: 'Toppings',
    prompt: 'Pick up to three toppings.',
    multi: true,
    max: 3,
    options: [
      { id: 'marshmallows', label: 'Marshmallows' },
      { id: 'cream', label: 'Whipped cream' },
      { id: 'chips', label: 'Chocolate chips' },
      { id: 'drizzle', label: 'Chocolate drizzle' },
      { id: 'cocoa', label: 'Cocoa dust' },
    ],
  },
];

export const DEFAULT_CHOICES = { base: null, flavour: null, sweetness: null, toppings: [] };

export const labelFor = (chamberId, optionId) => {
  const chamber = CHAMBERS.find((item) => item.id === chamberId);
  const option = chamber?.options.find((item) => item.id === optionId);
  return option?.label ?? optionId;
};

// Creative name from the choices, e.g. "The Midnight Hazelnut" or "The Marshmallow Dream".
export const drinkName = (choices) => {
  const moods = { dark: 'Midnight', milk: 'Golden', white: 'Snowy', creamy: 'Velvet' };
  const mood = moods[choices.base] ?? 'Cocoa';
  const flavour = choices.flavour ? labelFor('flavour', choices.flavour).split(' ')[0] : 'Classic';
  const dream = choices.toppings.includes('marshmallows') ? ' Dream' : '';
  return choices.flavour === 'classic' || !choices.flavour
    ? `The ${mood} ${choices.toppings.includes('marshmallows') ? 'Marshmallow' : 'Chocolate'}${dream}`
    : `The ${mood} ${flavour}${dream}`;
};

export const describeDrink = (choices) => {
  const base = choices.base ? labelFor('base', choices.base).toLowerCase() : 'chocolate';
  const sweet = { light: 'lightly sweet', balanced: 'balanced', extra: 'indulgently sweet' }[choices.sweetness] ?? 'balanced';
  const flavour = choices.flavour ? labelFor('flavour', choices.flavour).toLowerCase() : 'classic chocolate';
  const toppings = choices.toppings.length
    ? `topped with ${choices.toppings.map((id) => labelFor('toppings', id).toLowerCase()).join(', ')}`
    : 'served plain';
  return `A ${sweet} cup of ${base} with a ${flavour} note, ${toppings}. Made for you, in one quest.`;
};
