import { useEffect, useState } from "react";

const useFetch = (callback, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    callback()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, dependencies);

  return { data, loading };
};

export default useFetch;
