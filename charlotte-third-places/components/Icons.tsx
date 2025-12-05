// See https://react-icons.github.io/react-icons/

import { FcGoogle } from "react-icons/fc";
import { BsFillHousesFill } from "react-icons/bs";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { ArrowUp, Locate, Loader2 } from "lucide-react";
import { IconProps } from "@radix-ui/react-icons/dist/types";
import { 
  MdEditLocationAlt,
  MdAttachMoney,
  MdEmojiFoodBeverage,
  MdAutoAwesome
} from "react-icons/md";
import { 
  RiDrinks2Fill,
  RiChatAiLine,
  RiChatAiFill,
  RiRobot2Line,
  RiRobot2Fill
} from "react-icons/ri";
import {
  FaLocationPin,
  FaMapPin,
  FaMapLocationDot,
  FaShuffle,
  FaApple,
  FaXTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaCar,
  FaWifi,
  FaBookOpen,
  FaBreadSlice,
  FaUtensils,
  FaStore,
  FaBook,
  FaGamepad,
  FaPalette,
  FaUsers,
  FaLaptop,
  FaList,
  FaTags,
  FaMagnifyingGlassLocation,
  FaCouch,
  FaSuperpowers
} from "react-icons/fa6";

import {
  FaCoffee,
  FaShoppingCart,
  FaBeer,
  FaIceCream,
  FaCocktail,
  FaUniversity,
  FaWineBottle,
} from "react-icons/fa";

import {
  GiPlantSeed,
  GiCoffeeMug
} from "react-icons/gi";
import {
  FaFilter,
  FaChessQueen,
  FaComment,
  FaCross,
  FaArrowRight,
  FaArrowLeft,
  FaArrowsAltH,
  FaChevronDown,
  FaChevronUp,
  FaMobileAlt,
  FaDollarSign,
  FaTabletAlt,
  FaImages,
  FaDesktop,
  FaCircle,
  FaLink,
  FaQuestion,
  FaFolder,
  FaSearch,
  FaStar,
  FaCrown,
  FaCommentAlt,
  FaClock
} from "react-icons/fa";
import {
  IoHome,
  IoHomeOutline,
  IoMap,
  IoMapOutline,
  IoInformationCircle,
  IoInformationCircleOutline,
  IoCreate,
  IoCreateOutline,
  IoLogoTiktok,
  IoLogoYoutube,
  IoAlertCircle,
  IoLogoReddit,
  IoCamera,
  IoCameraOutline,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoFastFood,
  IoTrash,
  IoSparkles,
  IoSparklesOutline
} from "react-icons/io5";
import { FaLightbulb } from "react-icons/fa6";
import {
  LuMoon,
  LuSunMedium,
  LuLink,
  LuNotebookPen,
  LuExternalLink,
  LuInstagram,
  LuShare,
  LuLightbulb,
  LuArmchair,
  LuHeart,
  LuHeartHandshake,
  LuGamepad2
} from "react-icons/lu";

export const typeIconMap: { [key: string]: React.ComponentType<any> } = {
  "Bakery": FaBreadSlice,
  "Bottle Shop": FaWineBottle,
  "Café": GiCoffeeMug,
  "Coffee Shop": FaCoffee,
  "Tea House": MdEmojiFoodBeverage,
  "Bubble Tea Shop": RiDrinks2Fill,
  "Restaurant": FaUtensils,
  "Market": FaStore,
  "Grocery Store": FaShoppingCart,
  "Library": FaBook,
  "Bookstore": FaBookOpen,
  "Game Store": FaGamepad,
  "Garden": GiPlantSeed,
  "Brewery": FaBeer,
  "Deli": IoFastFood,
  "Eatery": FaUtensils,
  "Creamery": FaIceCream,
  "Ice Cream Shop": FaIceCream,
  "Art Gallery": FaPalette,
  "Bar": FaCocktail,
  "Community Center": FaUsers,
  "Coworking Space": FaLaptop,
  "Museum": FaUniversity,
  "Other": FaQuestion,
  "Photo Shop": IoCamera,
  "Lounge": FaCouch,
  "Comic Book Store": FaSuperpowers,
};

// Helper function to get the appropriate icon for a place type
export const getPlaceTypeIcon = (placeTypes: string | string[] | undefined): React.ComponentType<any> => {
  if (!placeTypes) {
    return FaChessQueen; // Fallback to queen icon
  }

  // If it's an array, use the first type
  const typeToCheck = Array.isArray(placeTypes) ? placeTypes[0] : placeTypes;

  // Return the mapped icon or fallback to queen
  return typeIconMap[typeToCheck] || FaChessQueen;
};

export const Icons = {
  arrowUp: ArrowUp,
  sun: LuSunMedium,
  moon: LuMoon,
  home: IoHome,
  chevronDown: FaChevronDown,
  dollarSign: FaDollarSign,
  chevronUp: FaChevronUp,
  cross: FaCross,
  photoGallery: FaImages,
  lightbulb: FaLightbulb,
  armchair: LuArmchair,
  heart: LuHeart,
  handHeart: LuHeartHandshake,
  gamepad: FaGamepad,
  gamepad2: LuGamepad2,
  laptop: FaLaptop,
  cinnamonRoll: (props: IconProps) => (
    <svg
      height="800px"
      width="800px"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M98.992 455.718v319.516h0.424c4.362 45.638 42.796 81.334 89.576 81.334h629.334c46.782 0 85.214-35.696 89.576-81.334h0.424V455.718H98.992z" fill="#FFB74B" />
      <path d="M107.658 415.374c3.46-8.502 14.418-19.288 25.22-28.446 6.95-6.578 15.244-12.922 24.762-18.994l0.27-0.186-0.004 0.018c68.136-43.318 198.67-72.624 348.54-72.624 220.246 0 398.788 63.278 398.788 141.334 0 78.056-178.542 141.334-398.788 141.334-220.244 0-398.788-63.278-398.788-141.334 0-6.018 1.068-11.948 3.128-17.768a169.404 169.404 0 0 1-3.128-3.334z" fill="#FFD59A" />
      <path d="M279.658 442.476c0-72.334 153.332-131.966 351.082-140.322-39.118-4.544-80.89-7.01-124.292-7.01-149.868 0-280.404 29.304-348.54 72.624l0.004-0.018-0.27 0.186c-9.518 6.07-17.812 12.416-24.762 18.994-10.802 9.16-21.76 19.944-25.22 28.446a169.404 169.404 0 0 0 3.128 3.334c-2.06 5.82-3.128 11.75-3.128 17.768 0 78.056 178.544 141.334 398.788 141.334 16.148 0 32.062-0.35 47.708-1.01-159.38-18.516-274.498-71.652-274.498-134.326z" fill="#FFC34C" />
      <path d="M199.002 328.412a310.49 112.512 0 1 0 620.98 0 310.49 112.512 0 1 0-620.98 0Z" fill="#FFD59A" />
      <path d="M589.492 420.922c-171.478 0-310.49-50.374-310.49-112.51 0-32.082 37.056-61.026 96.502-81.522-104.4 18.126-176.502 56.772-176.502 101.522 0 62.138 139.01 112.51 310.49 112.51 82.946 0 158.292-11.788 213.988-30.99-40.566 7.044-86.004 10.99-133.988 10.99z" fill="#FFC34C" />
      <path d="M289.642 244.83a214.016 77.552 0 1 0 428.032 0 214.016 77.552 0 1 0-428.032 0Z" fill="#FFD59A" />
      <path d="M603.658 302.382c-118.198 0-214.016-34.722-214.016-77.552 0-21.734 24.682-41.376 64.43-55.456-94.286 8.106-164.43 38.81-164.43 75.456 0 42.83 95.818 77.552 214.016 77.552 58.222 0 111.002-8.428 149.586-22.096a580.11 580.11 0 0 1-49.586 2.096z" fill="#FFC34C" />
      <path d="M199.416 775.236h-0.424V455.718h-100v319.516h0.424c4.362 45.638 42.796 81.334 89.576 81.334h100c-46.78 0-85.214-35.694-89.576-81.332zM807.902 775.236h0.424V455.718h100v319.516h-0.424c-4.362 45.638-42.796 81.334-89.576 81.334h-100c46.78 0 85.214-35.694 89.576-81.332z" fill="#FFA730" />
      <path d="M887.418 394.476c-58.168 53.376-206.726 91.334-380.844 91.334S183.902 447.852 125.732 394.476c-16.94 15.544-26.24 32.394-26.24 50 0 78.056 182.258 141.334 407.084 141.334s407.082-63.278 407.082-141.334c0-17.606-9.298-34.454-26.24-50z" fill="#E58D23" />
      <path d="M282.79 462.544c-71.02-16.262-126.508-40.036-157.058-68.068-16.94 15.544-26.24 32.394-26.24 50 0 78.056 182.258 141.334 407.084 141.334 30.928 0 61.044-1.204 90-3.472-165.01-12.932-292.048-60.648-313.786-119.794z" fill="#BF6C0D" />
      <path d="M509.492 364.294c-134.35 0-248.758-30.922-292.01-74.196-11.952 11.96-18.48 24.86-18.48 38.314 0 62.138 139.01 112.512 310.49 112.512s310.49-50.372 310.49-112.512c0-13.454-6.528-26.356-18.48-38.314-43.252 43.274-157.66 74.196-292.01 74.196z" fill="#E58D23" />
      <path d="M340.326 801.902m-30.668 0a30.668 30.668 0 1 0 61.336 0 30.668 30.668 0 1 0-61.336 0Z" fill="#FFA730" />
      <path d="M257.75 740.568m-30.668 0a30.668 30.668 0 1 0 61.336 0 30.668 30.668 0 1 0-61.336 0Z" fill="#FFA730" />
      <path d="M589.492 420.922c-151.838 0-278.202-39.498-305.158-91.684-29.17-11.132-52.136-24.418-66.852-39.142-11.952 11.958-18.48 24.86-18.48 38.314 0 62.138 139.01 112.512 310.49 112.512 82.946 0 158.292-11.788 213.986-30.99-40.564 7.044-86.002 10.99-133.986 10.99z" fill="#BF6C0D" />
      <path d="M544.236 415.932c18.502 0 33.5-14.998 33.5-33.5v-50.02a4 4 0 0 0-4-4h-59a4 4 0 0 0-4 4v50.02c0 18.502 14.998 33.5 33.5 33.5z" fill="#FFD59A" />
      <path d="M691.598 206.516c-36.822 23.434-106.368 39.238-186.106 39.238-79.74 0-149.286-15.804-186.106-39.238-17.758 11.302-27.912 24.378-27.912 38.314 0 42.83 95.818 77.552 214.016 77.552s214.016-34.72 214.016-77.552c0.002-13.936-10.15-27.012-27.908-38.314z" fill="#E58D23" />
      <path d="M605.492 302.382c-109.462 0-199.72-29.78-212.462-68.202-30.474-6.836-55.876-16.358-73.642-27.666-17.758 11.302-27.912 24.378-27.912 38.314 0 42.832 95.818 77.552 214.016 77.552 58.22 0 111.002-8.428 149.586-22.096a579.314 579.314 0 0 1-49.586 2.098z" fill="#BF6C0D" />
      <path d="M586.158 306.33c18.502 0 33.5-14.998 33.5-33.5v-66.906a4 4 0 0 0-4-4h-59a4 4 0 0 0-4 4v66.906c0 18.5 14.998 33.5 33.5 33.5z" fill="#FFD59A" />
      <path d="M686.326 715.342m-30.668 0a30.668 30.668 0 1 0 61.336 0 30.668 30.668 0 1 0-61.336 0Z" fill="#FFA730" />
      <path d="M782.658 630.332m-30.668 0a30.668 30.668 0 1 0 61.336 0 30.668 30.668 0 1 0-61.336 0Z" fill="#FFA730" />
      <path d="M426.984 190.034a84.796 22.756 0 1 0 169.592 0 84.796 22.756 0 1 0-169.592 0Z" fill="#E58D23" />
    </svg>
  ),
  alertCircle: IoAlertCircle,
  questionMark: FaQuestion,
  folder: FaFolder,
  search: FaSearch,
  openBook: FaBookOpen,
  sparkles: IoSparkles,
  sparkesOutline: IoSparklesOutline,
  chat: RiChatAiFill,
  chatOutline: RiChatAiLine,
  robot: RiRobot2Fill,
  robotOutline: RiRobot2Line,
  book: FaBook,
  attachMoney: MdAttachMoney,
  arrowLeftRight: FaArrowsAltH,
  arrowRight: FaArrowRight,
  houses: BsFillHousesFill,
  wifi: FaWifi,
  users: FaUsers,
  coffee: FaCoffee,
  notebookPen: LuNotebookPen,
  arrowLeft: FaArrowLeft,
  mobile: FaMobileAlt,
  tablet: FaTabletAlt,
  desktop: FaDesktop,
  shuffle: FaShuffle,
  share: LuShare,
  homeOutline: IoHomeOutline,
  google: FcGoogle,
  list: FaList,
  tags: FaTags,
  apple: (props: IconProps) => (
    <FaApple {...props} className={`text-apple ${props.className ?? ""}`} />
  ),
  editMarker: MdEditLocationAlt,
  filter: FaFilter,
  comment: FaComment,
  commentAlt: FaCommentAlt,
  star: FaStar,
  crown: FaCrown,
  queen: FaChessQueen,
  clock: FaClock,
  pin: FaLocationPin,
  circle: FaCircle,
  globe: HiOutlineGlobeAlt,
  map: IoMap,
  mapOutline: IoMapOutline,
  mapLocationDot: FaMapLocationDot,
  mapPin: FaMapPin,
  infoCircle: IoInformationCircle,
  infoCircleOutline: IoInformationCircleOutline,
  create: IoCreate,
  createOutline: IoCreateOutline,
  linkedIn: FaLinkedinIn,
  instagram: LuInstagram,
  youtube: IoLogoYoutube,
  tiktok: IoLogoTiktok,
  twitter: FaXTwitter,
  reddit: IoLogoReddit,
  link: LuLink,
  boldLink: FaLink,
  externalLink: LuExternalLink,
  locate: Locate,
  loader: Loader2,
  camera: IoCamera,
  cameraOutline: IoCameraOutline,
  chevronLeft: IoChevronBack,
  chevronRight: IoChevronForward,
  close: IoClose,
  facebook: FaFacebookF,
  car: FaCar,
  trash: IoTrash,
  magnifyingGlassLocationPin: FaMagnifyingGlassLocation,
  panAfricanFlag: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800px"
      height="800px"
      viewBox="0 0 900 600"
      {...props}
    >
      <path fill="#00853f" d="M0 0h900v600H0z" />
      <path d="M0 0h900v400H0z" />
      <path fill="#e31b23" d="M0 0h900v200H0z" />
    </svg>
  ),
  ethiopianFlag: (props: IconProps) => (
    <svg
      width="800px"
      height="800px"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path fill="#FCDD0A" d="M0 13h36v10H0z" />
      <path fill="#088930" d="M32 5H4a4 4 0 0 0-4 4v4h36V9a4 4 0 0 0-4-4z" />
      <path fill="#DA1219" d="M4 31h28a4 4 0 0 0 4-4v-4H0v4a4 4 0 0 0 4 4z" />
      <circle fill="#0F47AF" cx="18" cy="18" r="9" />
      <g fill="#FCDD0A">
        <path d="M13.25 24.469l1.719-5.531l-2.731-1.985h1.156l3.778 2.893l-.594.359l-.922-.83l-1.468 4.406z" />
        <path d="M22.609 24.469l-4.73-3.345l-2.723 1.97l.357-1.1l3.964-2.824l.158.676l-1.128.759l3.739 2.759z" />
        <path d="M25.382 15.64l-4.519 3.372l1.012 3.222l-.935-.677l-1.463-4.633l.693.058l.395 1.272l3.7-2.647z" />
        <path d="M17.872 10.07l1.86 5.487l3.344.05l-.933.68l-4.549-.038l.271-.642l.979-.06l-1.327-4.37zm-7.669 5.477h5.906l1.063-3.254l.358 1.098L16.012 18l-.526-.456l.476-1.372l-4.783.029zm7.526 6.765h.417v3.647h-.417zm7.847-2.087l-.128.396L22 19.466l.128-.396z" />
        <path d="M22.473 11.453l.337.245l-2.177 3.021l-.337-.244zm-9.359.245l.337-.245l2.174 3.021l-.336.245zm-2.637 8.923l-.129-.396l3.454-1.155l.129.397z" />
      </g>
    </svg>
  ),
  logo: (props: IconProps) => (
    <svg
      width="800px"
      height="800px"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="48" height="48" fill="white" fillOpacity="0.01" />
      <path
        d="M24 44C24 44 39 32 39 19C39 10.7157 32.2843 4 24 4C15.7157 4 9 10.7157 9 19C9 32 24 44 24 44Z"
        fill="hsl(190, 100%, 42%)"
        stroke="#000000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M24 25C27.3137 25 30 22.3137 30 19C30 15.6863 27.3137 13 24 13C20.6863 13 18 15.6863 18 19C18 22.3137 20.6863 25 24 25Z"
        fill="hsl(190, 100%, 42%)"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  gitHub: (props: IconProps) => (
    <svg viewBox="0 0 438.549 438.549" {...props}>
      <path
        fill="currentColor"
        d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
      ></path>
    </svg>
  )
}