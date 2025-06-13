/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";

interface SmoothScrollProviderProps {
	children: React.ReactNode;
}

const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({
	children,
}) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const locomotiveScrollRef = useRef<any>(null);

	useEffect(() => {
		let LocoScroll: any = null;

		const initializeLocomotiveScroll = async () => {
			try {
				// Dynamically import Locomotive Scroll to avoid SSR issues
				const LocomotiveScroll = (await import("locomotive-scroll")).default;

				if (scrollRef.current && !locomotiveScrollRef.current) {
					locomotiveScrollRef.current = new LocomotiveScroll({
						el: scrollRef.current,
						smooth: true,
						multiplier: 0.8,
						class: "is-revealed",
						scrollFromAnywhere: false,
						touchMultiplier: 2,
						smoothMobile: true,
						getDirection: true,
						getSpeed: true,
					});

					LocoScroll = locomotiveScrollRef.current;

					// Update on resize
					const handleResize = () => {
						setTimeout(() => {
							if (locomotiveScrollRef.current) {
								locomotiveScrollRef.current.update();
							}
						}, 150);
					};

					window.addEventListener("resize", handleResize);

					return () => {
						window.removeEventListener("resize", handleResize);
					};
				}
			} catch (error) {
				console.warn("Locomotive Scroll failed to load:", error);
			}
		};

		initializeLocomotiveScroll();

		return () => {
			if (locomotiveScrollRef.current) {
				try {
					locomotiveScrollRef.current.destroy();
					locomotiveScrollRef.current = null;
				} catch (error) {
					console.warn("Error destroying Locomotive Scroll:", error);
				}
			}
		};
	}, []);

	// Update scroll when children change
	useEffect(() => {
		const timer = setTimeout(() => {
			if (locomotiveScrollRef.current) {
				try {
					locomotiveScrollRef.current.update();
				} catch (error) {
					console.warn("Error updating Locomotive Scroll:", error);
				}
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [children]);

	return (
		<div
			ref={scrollRef}
			data-scroll-container
			id="scroll-container"
			className="locomotive-scroll-container"
		>
			{children}
		</div>
	);
};

export default SmoothScrollProvider;
