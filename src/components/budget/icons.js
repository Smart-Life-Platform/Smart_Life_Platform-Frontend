import {
  UilShoppingBasket, UilUtensils, UilBus, UilMedkit, UilHome, UilStar,
  UilEllipsisH, UilBriefcase, UilGift,
} from '@iconscout/react-unicons';

// ключ з mockData -> іконка Unicons
const map = {
  basket: UilShoppingBasket,
  food: UilUtensils,
  bus: UilBus,
  health: UilMedkit,
  home: UilHome,
  star: UilStar,
  other: UilEllipsisH,
  work: UilBriefcase,
  gift: UilGift,
};

export const getIcon = (key) => map[key] || UilEllipsisH;
