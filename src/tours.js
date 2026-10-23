import greatWallImg from "./assets/tours/great-wall-of-china.jpg";
import tajMahalImg from "./assets/tours/taj-mahal.jpg";
import petraImg from "./assets/tours/petra.jpg";
import colosseumImg from "./assets/tours/colosseum.jpg";
import chichenItzaImg from "./assets/tours/chichen-itza.jpg";
import machuPicchuImg from "./assets/tours/machu-picchu.jpg";
import christRedeemerImg from "./assets/tours/christ-redeemer.jpg";

import everestImg from "./assets/tours/mount-everest.jpg";
import k2Img from "./assets/tours/k2-mountain.jpg";
import kangchenjungaImg from "./assets/tours/kangchenjunga.jpg";

export const tours = [
  {
    id: "wonders",
    name: "7 New Wonders of the World",
    stops: [
      {
        name: "Taj Mahal",
        lat: 27.1751,
        lng: 78.0421,
        description:
          "An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra, India.",
        image: tajMahalImg,
        link: "https://en.wikipedia.org/wiki/Taj_Mahal",
      },
      {
        name: "Petra",
        lat: 30.3285,
        lng: 35.4444,
        description:
          "A historical and archaeological city in southern Jordan, famous for its rock-cut architecture.",
        image: petraImg,
        link: "https://en.wikipedia.org/wiki/Petra",
      },
      {
        name: "Colosseum",
        lat: 41.8902,
        lng: 12.4922,
        description:
          "An oval amphitheatre in the centre of the city of Rome, Italy. The largest ancient amphitheatre ever built.",
        image: colosseumImg,
        link: "https://en.wikipedia.org/wiki/Colosseum",
      },
      {
        name: "Great Wall of China",
        lat: 40.4319,
        lng: 116.5704,
        description:
          "A series of fortifications built across the historical northern borders of ancient Chinese states.",
        image: greatWallImg,
        link: "https://en.wikipedia.org/wiki/Great_Wall_of_China",
      },
      {
        name: "Chichén Itzá",
        lat: 20.6843,
        lng: -88.5678,
        description:
          "A large pre-Columbian city built by the Maya people of the Terminal Classic period.",
        image: chichenItzaImg,
        link: "https://en.wikipedia.org/wiki/Chichen_Itza",
      },
      {
        name: "Machu Picchu",
        lat: -13.1631,
        lng: -72.545,
        description:
          "A 15th-century Inca citadel located in the Eastern Cordillera of southern Peru.",
        image: machuPicchuImg,
        link: "https://en.wikipedia.org/wiki/Machu_Picchu",
      },
      {
        name: "Christ the Redeemer",
        lat: -22.9519,
        lng: -43.2105,
        description:
          "An Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil.",
        image: christRedeemerImg,
        link: "https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)",
      },
    ],
  },
  {
    id: "mountains",
    name: "World's Highest Peaks",
    stops: [
      {
        name: "Mount Everest",
        lat: 27.9881,
        lng: 86.925,
        description:
          "Earth's highest mountain above sea level, located in the Himalayas.",
        image: everestImg,
        link: "https://en.wikipedia.org/wiki/Mount_Everest",
      },
      {
        name: "K2",
        lat: 35.88,
        lng: 76.5151,
        description:
          "The second-highest mountain on Earth, known as the Savage Mountain.",
        image: k2Img,
        link: "https://en.wikipedia.org/wiki/K2",
      },
      {
        name: "Kangchenjunga",
        lat: 27.7025,
        lng: 88.1475,
        description:
          "The third highest mountain in the world. Called Five Treasures of Snow.",
        image: kangchenjungaImg,
        link: "https://en.wikipedia.org/wiki/Kangchenjunga",
      },
    ],
  },
];
