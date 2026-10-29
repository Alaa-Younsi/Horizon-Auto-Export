import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * GSAP + plugins, registered once. GSAP (incl. SplitText) is free for commercial
 * use under the GreenSock "no charge" licence since 3.13.
 */
gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: "expo.out", duration: 1 });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };
