import React from 'react';

const SEO = ({ title, description, keywords }) => {
  return (
    <>
      <title>{title ? `${title} | Portfolio of Evidence` : 'Portfolio of Evidence | Headway College POE Portal'}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
    </>
  );
};

export default SEO;
