import {
  UilShoppingCart, UilCoffee, UilBus, UilHeartbeat, UilHome, UilFilm,
  UilEllipsisH, UilBriefcase, UilGift,
} from '@iconscout/react-unicons';

// ключ з mockData -> іконка Unicons
const map = {
  cart: UilShoppingCart,
  coffee: UilCoffee,
  bus: UilBus,
  health: UilHeartbeat,
  home: UilHome,
  fun: UilFilm,
  other: UilEllipsisH,
  work: UilBriefcase,
  gift: UilGift,
};

export const getIcon = (key) => map[key] || UilEllipsisH;
