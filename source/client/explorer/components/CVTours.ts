/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Dictionary } from "@ff/core/types";

import { ITour as ITourData, TCurveType } from "common/types/item";

import CVCollection from "./CVCollection";

////////////////////////////////////////////////////////////////////////////////

export interface ITour
{
    id?: string;
    title: string;
    description: string;
    steps: ITourStep[];
}

export interface ITourStep
{
    snapshotId: string;
    transitionTime: number;
    transitionCurve: TCurveType;
    transitionCutPoint: number;
}

export default class CVTours extends CVCollection<ITour>
{
    static readonly typeName: string = "CVTours";

    create()
    {
    }

    addTour(tour: ITour)
    {
        this.insert(tour);

        this.emit("changed");
    }

    removeTour(id: string)
    {
        const tour = this.remove(id);

        this.emit("changed");

        return tour;
    }

    fromData(data: ITourData[], snapIds: string[])
    {
        data.forEach(tourData => {
            this.addTour({
                title: tourData.title,
                description: tourData.description || "",
                steps: tourData.steps.map(stepData => ({
                    snapshotId: snapIds[stepData.snapshot],
                    transitionTime: stepData.transitionTime,
                    transitionCurve: stepData.transitionCurve,
                    transitionCutPoint: stepData.transitionCutPoint
                }))
            });
        });
    }

    toData(snapIds: Dictionary<number>): ITourData[]
    {
        const tours = this.getArray();

        return tours.map(tour => {
            const tourData: ITourData = {
                title: tour.title,
                steps: tour.steps.map(step => ({
                    snapshot: snapIds[step.snapshotId],
                    transitionTime: step.transitionTime,
                    transitionCurve: step.transitionCurve,
                    transitionCutPoint: step.transitionCutPoint
                }))
            };

            if (tour.description) {
                tourData.description = tour.description;
            }

            return tourData;
        })
    }
}