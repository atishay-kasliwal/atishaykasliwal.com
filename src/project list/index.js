import { project1Healthcare } from './project1-healthcare';
import { project2Gemma } from './project2-gemma';
import { project3Movie } from './project3-movie';
import { project4Hospitality } from './project4-hospitality';
import { project5Template } from './project5-template';
import { project6Encryption } from './project6-encryption';

export const projectArticles = [
  project1Healthcare,
  project2Gemma,
  project3Movie,
  project4Hospitality,
  project5Template,
  project6Encryption,
];

export function getProjectArticleByUuid(uuid) {
  return projectArticles.find((p) => p.uuid === uuid) || null;
}

