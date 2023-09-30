"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Uploader from "./uploader";
import LoadingCircle from "../icons/loading-circle";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

export default function PostForm({
  title,
  description,
  helpText,
  inputAttrs,
  handleSubmit,
  postTitle,
}: {
  title: string;
  description: string;
  helpText: string;
  inputAttrs: {
    name: string;
    type: string;
    defaultValue: string;
    placeholder?: string;
    maxLength?: number;
    pattern?: string;
  };
  postTitle?: string | null;
  handleSubmit: any;
}) {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const { update } = useSession();

  const makeSlug = (title: string | null | undefined) => {
    return title?.toLowerCase()?.replaceAll(" ", "-");
  };
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState(makeSlug(postTitle));

  const [debouncedData] = useDebounce(slug, 1000);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (postTitle) {
      setSlug(makeSlug(postTitle));
    } else {
      setSlug(inputAttrs.defaultValue);
    }
  }, [slug, postTitle, inputAttrs.defaultValue]);

  useEffect(() => {
    if (debouncedData === makeSlug(postTitle)) {
      return;
    }
    setIsLoading(true);
    formRef.current?.requestSubmit();
  }, [slug, debouncedData]);

  const deleteDefaultValue = (props: any) => {
    delete props.defaultValue;
    return props;
  };

  return (
    <form
      ref={formRef}
      action={async (data: FormData) => {
        if (!slug) {
          setIsLoading(false);
          toast.error("Slug required");
          return;
        }
        let formData = new FormData();
        formData.append("slug", slug!);
        handleSubmit(formData, id, inputAttrs.name).then(async (res: any) => {
          setIsLoading(false);
          if (res.error) {
            toast.error(res.error);
          } else {
            if (id) {
              router.refresh();
            } else {
              await update();
              router.refresh();
            }
            toast.success(`Successfully updated ${inputAttrs.name}!`);
          }
        });
      }}
      className="rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-black"
    >
      <div className="relative flex flex-col space-y-4 p-5 sm:p-10">
        <div className="flex justify-between">
          <h2 className="font-inter text-xl dark:text-white">{title}</h2>
          {isLoading ? <LoadingCircle /> : <></>}
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {description}
        </p>
        {inputAttrs.name === "image" || inputAttrs.name === "logo" ? (
          <Uploader
            defaultValue={inputAttrs.defaultValue}
            name={inputAttrs.name}
          />
        ) : (
          <input
            // {...inputAttrs}
            {...deleteDefaultValue(inputAttrs)}
            value={slug}
            required
            className="w-full max-w-md rounded-md border border-stone-300 text-sm text-stone-900 placeholder-stone-300 focus:border-stone-500 focus:outline-none focus:ring-stone-500 dark:border-stone-600 dark:bg-black dark:text-white dark:placeholder-stone-700"
            onChange={(e) => {
              setSlug(e.target.value);
            }}
            disabled={isLoading}
          />
        )}
      </div>
    </form>
  );
}
