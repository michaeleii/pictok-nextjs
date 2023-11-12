"use client";

import LoadSpinnerSVG from "@/components/icons/LoadSpinnerSVG";
import { ChevronLeft } from "lucide-react";

import { useEffect, useReducer, useRef } from "react";
import supabase from "@/db/supabase";
import Link from "next/link";
import Image from "next/image";

import { getCaption } from "@/lib/getCaption";
import { formatCaption } from "@/lib/formatCaption";
import { getSound } from "@/lib/getSound";
import { useSwipeable } from "react-swipeable";
import { useRouter } from "next/navigation";
import { randomName } from "@/lib/randomImageName";
import Gesture from "@/components/design/Gesture";
import { speak } from "@/lib/speak";
import { useTheme } from "next-themes";

const storagePath =
  "https://bmtbohuzvkdifffdwayv.supabase.co/storage/v1/object/public";

type ReducerState = {
  status:
    | "processing photo"
    | "show tap gesture one"
    | "show swipe right gesture two"
    | "finished processing";
  caption: string;
};

type ReducerAction =
  | {
      type: "processing_photo";
      status: "processing photo";
    }
  | {
      type: "gesture_one";
      status: "show tap gesture one";
      caption: string;
    }
  | {
      type: "gesture_two";
      status: "show swipe right gesture two";
    }
  | {
      type: "finished_processing";
      status: "finished processing";
    };

const initialState: ReducerState = {
  status: "processing photo",
  caption: "",
};

const photoProcessingReducer = (
  state: ReducerState,
  action: ReducerAction,
): ReducerState => {
  switch (action.type) {
    case "processing_photo":
      return { ...state, status: action.status };

    case "gesture_one":
      return {
        ...state,
        status: action.status,
        caption: action.caption,
      };

    case "gesture_two":
      return { ...state, status: action.status };

    case "finished_processing":
      return { ...state, status: action.status };

    default:
      return state;
  }
};

export default function PhotoProcessing({
  searchParams: { photoBlobUrl },
}: {
  searchParams: { photoBlobUrl: string };
}) {
  const router = useRouter();
  const theme = useTheme();
  const [state, dispatch] = useReducer(photoProcessingReducer, initialState);
  const { status, caption } = state;
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const handler = useSwipeable({
    onSwipedRight: () => {
      if (status == "finished processing") router.push("/friends");
    },
    onTap: () => {
      if (
        status == "processing photo" ||
        status == "show swipe right gesture two"
      )
        return;
      window.speechSynthesis.cancel();
      audioRef.current.pause();
      speak(caption, async () => {
        await audioRef.current.play();
        audioRef.current.onended = () => {
          if (status == "show tap gesture one") {
            dispatch({
              type: "gesture_two",
              status: "show swipe right gesture two",
            });
            speak("Swipe right to send to friends", () => {
              dispatch({
                type: "finished_processing",
                status: "finished processing",
              });
            });
          }
        };
      });
    },
    trackMouse: true,
  });

  useEffect(() => {
    const audio = audioRef.current;
    const handleConversionToSound = async () => {
      speak("Image processing is in progress. Please wait.");
      // wait 3 seconds
      const response = await fetch(photoBlobUrl);
      // Blob object
      const blobData = await response.blob();
      //Generate a random image name that will be used
      // to store the image in supabase storage
      const imageName =
        (await randomName()) + blobData.type.replace("image/", ".");
      //Save the photo to supabase storage
      const { data, error: imageUploadError } = await supabase.storage
        .from("images")
        // We can upload imageName using either a Blob object or a File object
        .upload(imageName, blobData);
      if (imageUploadError) {
        throw imageUploadError;
      }
      //Get the photo url string
      const image_url = `${storagePath}/images/${data?.path}`;

      // get caption from photo public url
      const res = await getCaption(image_url);
      const captionData: { output: string } = await res.json();
      const caption = formatCaption(String(captionData.output));

      // get sound from caption
      const { output: sound } = await getSound(caption);
      // upload sound to supabase storage
      const res2 = await fetch(sound);
      const soundBlob = await res2.blob();
      const audioName = `${await randomName()}.mp3`.replace("/", "");
      const { data: audioData, error: SoundUploadError } =
        await supabase.storage.from("audio").upload(audioName, soundBlob);
      if (SoundUploadError) {
        throw SoundUploadError;
      }
      const audio_url = `${storagePath}/audio/${audioData?.path}`;

      const { error: imageAudioError } = await supabase
        .from("image_audio")
        .insert([{ image_url, audio_url, caption }]);

      if (imageAudioError) {
        throw imageAudioError;
      }
      // // wait 3 seconds
      // await new Promise((resolve) => setTimeout(resolve, 5000));
      dispatch({
        type: "gesture_one",
        status: "show tap gesture one",
        caption,
      });
      audio.src = sound;
      speak("Tap to listen");
    };
    handleConversionToSound();
    return () => {
      // This function will be called when the component is unmounted
      window.speechSynthesis.cancel();
      audio.pause();
    };
  }, [photoBlobUrl]);

  return (
    <main className="mx-auto max-h-screen max-w-lg overflow-hidden px-2">
      <div className="relative flex items-center justify-center py-5">
        <Link href="/" className="absolute left-2">
          <ChevronLeft aria-label="Go back" />
        </Link>
        <h1 className="text-2xl font-bold">Photo</h1>
      </div>

      <div>
        <div className="relative h-[90vh] bg-muted" {...handler}>
          <Image
            src={photoBlobUrl}
            alt={caption || "Image to be processed"}
            fill
            className={`h-full object-contain`}
          />
          {/* Transparent overlay div */}
          <div className="absolute left-0 top-0 h-full w-full bg-transparent"></div>
          {status == "show tap gesture one" && (
            <Gesture
              message="Tap to listen"
              gifName={`${theme.theme == "dark" ? "D-Tap" : "L-Tap"}`}
            />
          )}
          {status == "show swipe right gesture two" && (
            <Gesture
              message="Swipe right to send to friends"
              gifName={`${
                theme.theme == "dark" ? "D-SwipeRight" : "L-SwipeRight"
              }`}
            />
          )}
          {status == "processing photo" && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-full w-full items-center justify-center bg-[#FEFFFF99] backdrop-blur dark:bg-[#00000091]">
                  <LoadSpinnerSVG />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-4xl text-black dark:text-white">
                  Processing
                </h1>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
