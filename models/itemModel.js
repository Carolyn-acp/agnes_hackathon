let nextId = 3;

const items = [
  { id: 1, name: 'First MVC item' },
  { id: 2, name: 'Build something useful' }
];

exports.getAll = () => items;

exports.create = ({ name }) => {
  const item = {
    id: nextId,
    name
  };

  nextId += 1;
  items.push(item);

  return item;
};
