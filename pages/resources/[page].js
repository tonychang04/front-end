/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import get from 'lodash/get';
import Content from 'components/Content/Content';
import Head from 'components/head';
import HeroBanner from 'components/HeroBanner/HeroBanner';
import Pagination from 'components/Pagination/Pagination';
import ResourceCard from 'components/Cards/ResourceCard/ResourceCard';
import ResourceSkeletonCard from 'components/Cards/ResourceCard/ResourceSkeletonCard';
import {
  getResourcesPromise,
  getResourcesByCategories,
  getResourcesByLanguages,
  getResourcesBySearch,
} from 'common/constants/api';
import { Field, Formik } from 'formik';
import Form from 'components/Form/Form';
import Input from 'components/Form/Input/Input';
import styles from '../styles/resources.module.css';
import ThemedReactSelect from '../../components/Form/Select/ThemedReactSelect';
import Alert from '../../components/Alert/Alert';
// import { RESOURCE_CARD } from '../../common/constants/testIDs';

const pageTitle = 'Resources';

function Resources() {
  const router = useRouter();
  const { pathname, query } = router;
  const { page, category, languages, paid, q } = query;
  const currentPage = parseInt(page, 10);

  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [resources, setResources] = useState([]);
  const [totalPages, setTotalPages] = useState(currentPage);

  const [allCategories, setAllCategories] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);

  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const costOptions = [
    { label: 'Paid', value: true },
    { label: 'Free', value: false },
  ];

  const handleEndpoint = () => {
    if (q || paid) {
      return getResourcesBySearch({ page, q, paid });
    }
    if (languages || category) {
      return getResourcesPromise({ page, category, languages, paid });
    }
    return getResourcesBySearch({ page, q, paid });
  };

  useEffect(() => {
    Promise.all([getResourcesByCategories(), getResourcesByLanguages()])
      .then(([categoriesResponse, languagesResponse]) => {
        const {
          data: { data: categoriesData },
        } = categoriesResponse;
        const {
          data: { data: languagesData },
        } = languagesResponse;

        setAllLanguages(
          languagesData.map(languageObject => {
            return {
              value: languageObject.name.toLowerCase(),
              label: languageObject.name,
            };
          }),
        );
        setAllCategories(
          categoriesData.map(categoryObject => {
            return {
              value: categoryObject.name.toLowerCase(),
              label: categoryObject.name,
            };
          }),
        );
      })
      .catch(() => {
        setErrorMessage('There was an error finding these resources.');
      });

    setErrorMessage(null);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(currentPage)) {
      console.warn('invalid page');
    }
    handleEndpoint()
      .then(response => {
        const fetchedResources = get(response, 'data.data', []);
        const fetchedNumberOfPages = get(response, 'data.number_of_pages', 0);

        if (fetchedResources.length === 0 || fetchedNumberOfPages === 0) {
          console.log('nothing returned');
          return;
        }
        setResources(fetchedResources);
        if (q) {
          setTotalPages(fetchedNumberOfPages - 1);
        } else {
          setTotalPages(fetchedNumberOfPages);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage('There was an error gathering those resources.');
        setIsLoading(false);
      });
  }, [query]);

  const updateQuery = newQueryObject => {
    setErrorMessage(null);
    router.push(
      {
        pathname,
        query: { page, ...newQueryObject },
      },
      {
        pathname: pathname.replace('[page]', '1'),
        query: { ...newQueryObject },
      },
    );
  };

  const handleSearch = search => {
    updateQuery(search);
  };

  const handleCost = isPaid => {
    const { value } = isPaid;
    updateQuery({ paid: value });
  };

  const handleCategory = categoryInput => {
    const { value } = categoryInput;
    updateQuery({ category: value });
  };

  const handleLanguages = languageList => {
    if (!languageList) {
      return;
    }
    const languageValues =
      languageList && !!languageList.length ? languageList.map(language => language.value) : null;
    setSelectedLanguages(languageValues);
    updateQuery({ languages: languageValues });
  };

  return (
    <>
      <Head title={pageTitle} />
      <HeroBanner title={pageTitle} className="smallHero" />
      <Content
        theme="white"
        columns={[
          <section className={styles.fullWidth}>
            <Formik onSubmit={handleSearch}>
              <Form>
                <Field type="search" name="q" label="Search" component={Input} />
              </Form>
            </Formik>

            <div className={styles.selectContainer}>
              <div className={styles.selectColumn}>
                <h5>By Category</h5>
                <ThemedReactSelect
                  instanceId="category_select"
                  placeholder="Start typing a category..."
                  className={styles.select}
                  name="Categories"
                  options={allCategories}
                  onChange={handleCategory}
                />
              </div>

              <div className={styles.selectColumn}>
                <h5>By Language</h5>
                <ThemedReactSelect
                  instanceId="language_select"
                  placeholder="Start typing a language..."
                  className={styles.select}
                  isMulti
                  name="Languages"
                  options={allLanguages}
                  onChange={handleLanguages}
                  selected={selectedLanguages}
                />
              </div>

              <div className={styles.selectColumn}>
                <h5>By Cost</h5>
                <ThemedReactSelect
                  instanceId="cost_select"
                  placeholder="Course cost..."
                  className={styles.select}
                  name="Paid"
                  options={costOptions}
                  onChange={handleCost}
                />
              </div>

              <div className={styles.selectColumn}>
                <h5>By Date</h5>
                <ThemedReactSelect
                  instanceId="cost_select"
                  placeholder="Resources added before..."
                  className={styles.select}
                  name="Paid"
                  options={costOptions}
                  onChange={handleCost}
                />
              </div>
            </div>

            {isLoading ? (
              <>
                <ResourceSkeletonCard numberOfSkeletons={10} />
              </>
            ) : (
              <>
                {errorMessage && <Alert type="error">{`${errorMessage}`}</Alert>}
                <div className={styles.resourcesCardWrapper}>
                  {resources.map(resource => (
                    <ResourceCard
                      data-testid="RESOURCE_CARD"
                      key={resource.id}
                      description={resource.notes}
                      downvotes={resource.downvotes}
                      upvotes={resource.upvotes}
                      href={resource.url || ''}
                      name={resource.name}
                      className={styles.resourceCard}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pathname={pathname}
                  query={query}
                />
              </>
            )}
          </section>,
        ]}
      />
    </>
  );
}

export default Resources;

/* I realize I can't really do this because then the query string changes on rerender 
after changing pages etc. trying to figure out how to make it pretty in the url bar 
without uriencoded characters */

// const formatQueryStringObject = () => {
//   const slugifiedArray = Object.entries(query).map(value => [
//     [value[0]],
//     value[1].replace(' ', '-'),
//   ]);
//   const slugifiedObject = Object.fromEntries(slugifiedArray);
//   const relevantQueryStringObject = omit(slugifiedObject, ['page']);
//   return relevantQueryStringObject;
// };
