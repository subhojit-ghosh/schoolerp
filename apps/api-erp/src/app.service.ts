import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    // Keep the health response tiny so watch-mode restarts are easy to verify after backend edits.
    return {
      status: "ok",
    };
  }
}
