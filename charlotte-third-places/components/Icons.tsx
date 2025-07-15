// See https://react-icons.github.io/react-icons/

import { FcGoogle } from "react-icons/fc";
import { BsFillHousesFill } from "react-icons/bs";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { RiDrinks2Fill } from "react-icons/ri";
import { ArrowUp, Locate, Loader2 } from "lucide-react";
import { IconProps } from "@radix-ui/react-icons/dist/types";
import { MdEditLocationAlt, MdAttachMoney, MdEmojiFoodBeverage } from "react-icons/md";
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
  FaList
} from "react-icons/fa6";

import {
  FaCoffee,
  FaShoppingCart,
  FaBeer,
  FaIceCream,
  FaCocktail,
  FaUniversity,
  FaWineBottle
} from "react-icons/fa";

import {
  GiPlantSeed,
  GiCoffeeMug
} from "react-icons/gi";
import {
  FaFilter,
  FaChessQueen,
  FaComment,
  FaArrowRight,
  FaArrowLeft,
  FaArrowsAltH,
  FaChevronDown,
  FaChevronUp,
  FaMobileAlt,
  FaDollarSign,
  FaTabletAlt,
  FaDesktop,
  FaCircle,
  FaLink,
  FaQuestion,
  FaFolder,
  FaSearch,
  FaStar,
  FaCrown,
  FaCommentAlt
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
  IoFastFood
} from "react-icons/io5";
import {
  LuMoon,
  LuSunMedium,
  LuLink,
  LuNotebookPen,
  LuExternalLink,
  LuInstagram,
  LuShare
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
  cinnamonRoll: (props: IconProps) => (
    <svg
      height="800px"
      width="800px"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      {...props}
    >
      <path style={{ fill: "#FFB655" }} d="M434.327,54.492C386.408,19.352,323.077,0,256,0c-5.148,0-10.271,0.127-15.371,0.354
        c-0.006,0-0.012,0-0.019,0.002c-61.327,2.726-118.7,21.698-162.937,54.137C27.584,91.224,0,140.747,0,193.939v124.121
        c0,53.192,27.584,102.715,77.674,139.447c14.974,10.982,31.454,20.421,49.082,28.21c3.525,1.558,7.097,3.05,10.712,4.475
        c1.808,0.712,3.626,1.409,5.454,2.087c3.657,1.358,7.356,2.648,11.093,3.871c9.345,3.055,18.932,5.685,28.717,7.874
        c3.914,0.875,7.86,1.682,11.835,2.416C214.443,510.11,235.039,512,256,512c67.077,0,130.408-19.352,178.327-54.492
        C484.416,420.776,512,371.253,512,318.061V193.939C512,140.747,484.416,91.224,434.327,54.492z"/>
      <path style={{ fill: "#806749" }} d="M434.325,54.492C386.408,19.352,323.077,0,256,0c-5.148,0-10.271,0.129-15.371,0.354
        c-0.006,0-0.012,0-0.019,0.002c-61.327,2.726-118.7,21.698-162.937,54.137C27.584,91.224,0,140.747,0,193.939
        c0,28.678,8.032,56.286,23.273,81.402c6.474,10.668,14.254,20.883,23.273,30.542c9.131,9.778,19.517,18.987,31.128,27.504
        c47.919,35.14,111.25,54.492,178.326,54.492s130.408-19.352,178.325-54.492c11.612-8.516,21.999-17.726,31.13-27.504
        c9.021-9.658,16.798-19.873,23.273-30.542C503.968,250.225,512,222.619,512,193.939C512,140.747,484.416,91.224,434.325,54.492z
         M462.801,217.212c-6.703,29.314-26,56.638-56.002,78.64c-39.993,29.328-93.549,45.481-150.8,45.481S145.194,325.181,105.2,295.852
        c-30.002-22.002-49.299-49.326-56.002-78.64c-1.749-7.643-2.653-15.419-2.653-23.273c0-7.854,0.905-15.63,2.653-23.273
        c6.703-29.314,26-56.638,56.002-78.64c36.537-26.795,84.392-42.581,136.043-45.113c73.616,4.704,131.146,55.946,131.146,117.029
        c0,2.264-0.138,4.501-0.343,6.723c-0.74,8.104-2.794,15.911-6.015,23.273c-3.679,8.408-8.844,16.24-15.258,23.273
        c-19.915,21.833-51.731,35.997-87.516,35.997c-31.843,0-59.522-14.631-73.32-35.997c-4.591-7.109-7.646-14.96-8.8-23.273
        c-0.343-2.461-0.535-4.957-0.535-7.489c0-5.523,1.181-10.83,3.326-15.784c8.291-19.155,31.215-32.967,58.145-32.967
        c12.853,0,23.273-10.42,23.273-23.273s-10.42-23.273-23.273-23.273c-53.464,0-97.953,34.454-106.505,79.512
        c-0.976,5.139-1.51,10.404-1.51,15.784c0,2.52,0.129,5.01,0.313,7.489c0.6,8.014,2.157,15.796,4.565,23.273
        c15.329,47.569,65.238,82.542,124.321,82.542c64.178,0,119.408-34.057,143.196-82.542c3.651-7.441,6.56-15.222,8.648-23.273
        c1.956-7.542,3.195-15.318,3.643-23.273c0.124-2.228,0.191-4.468,0.191-6.723c0-28.348-8.279-55.696-23.797-79.856
        c4.001,2.527,7.893,5.174,11.663,7.939c30,22.004,49.298,49.327,56,78.642c1.749,7.643,2.653,15.419,2.653,23.273
        C465.455,201.793,464.55,209.569,462.801,217.212z"/>
      <path style={{ fill: "#EE8700" }} d="M77.674,333.386c-11.612-8.516-21.999-17.726-31.128-27.504
        c-9.019-9.658-16.798-19.873-23.273-30.542C8.032,250.225,0,222.618,0,193.939v124.121c0,53.192,27.584,102.715,77.674,139.447
        C125.592,492.648,188.923,512,256,512V387.879C188.923,387.879,125.592,368.527,77.674,333.386z"/>
    </svg>
  ),
  alertCircle: IoAlertCircle,
  questionMark: FaQuestion,
  folder: FaFolder,
  search: FaSearch,
  openBook: FaBookOpen,
  attachMoney: MdAttachMoney,
  arrowLeftRight: FaArrowsAltH,
  arrowRight: FaArrowRight,
  houses: BsFillHousesFill,
  wifi: FaWifi,
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