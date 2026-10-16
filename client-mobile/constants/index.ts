import onboarding1 from "../assets/images/onboarding1.png";
import banner1 from "../assets/images/banner-1.png";
import banner2 from "../assets/images/banner-2.png";
import banner3 from "../assets/images/banner-3.png";
import signUpCar from "../assets/images/signup-car.png";


export const images = {
  onboarding1,
  banner1,
  banner2,
  banner3,
  signUpCar,
};

export const user = {

}



export const banner = [
  {
    id: 1,
    images: images.banner1
  },
  {
    id: 2,
    images: images.banner2
  },
  {
    id: 3,
    images: images.banner3
  }
]
export const onboarding = [
  {
    id: 1,
    title: "The perfect ride is just a tap away!",
    description:
      "Your journey begins with Ryde. Find your ideal ride effortlessly.",
    image: images.onboarding1,
  }
  // {
  //   id: 2,
  //   title: "Best car in your hands with Ryde",
  //   description:
  //     "Discover the convenience of finding your perfect ride with Ryde",
  //   image: images.onboarding2,
  // },
  // {
  //   id: 3,
  //   title: "Your ride, your way. Let's go!",
  //   description:
  //     "Enter your destination, sit back, and let us take care of the rest.",
  //   image: images.onboarding3,
  // },
];

export const data = {
  onboarding,
};
